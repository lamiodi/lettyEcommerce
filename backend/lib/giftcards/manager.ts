/**
 * Gift card validation, atomic debit, and creation.
 * The debit is performed by the `debit_gift_card` SQL function, which
 * closes the over-debit race window that a previous client-side
 * implementation left open.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Currency } from "@/lib/validations";

export interface GiftCardValidation {
  giftCardId: string;
  code: string;
  currentBalance: number;
  currency: Currency;
  status: string;
  expiresAt: string | null;
}

export async function validateGiftCard(code: string, currency: Currency): Promise<GiftCardValidation> {
  const { data, error } = await supabaseAdmin()
    .from("gift_cards")
    .select("id, code, current_balance, currency, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) throw new Error(`Gift card lookup failed: ${error.message}`);
  if (!data) throw new NotFoundError("Gift card not found");
  if (data.status !== "active") throw new ConflictError(`Gift card is ${data.status}`);
  if (data.currency !== currency) {
    throw new ConflictError(`Gift card is for ${data.currency}, not ${currency}`);
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new ConflictError("Gift card has expired");
  }
  if (Number(data.current_balance) <= 0) {
    throw new ConflictError("Gift card has no remaining balance");
  }

  return {
    giftCardId: data.id,
    code: data.code,
    currentBalance: Number(data.current_balance),
    currency: data.currency as Currency,
    status: data.status,
    expiresAt: data.expires_at,
  };
}

export interface DebitResult {
  newBalance: number;
  amountDebited: number;
  status: string;
}

/**
 * Atomic debit. The SQL function:
 *  - decrements `current_balance`
 *  - flips status to `redeemed` when the balance hits zero
 *  - inserts a `gift_card_transactions` row in the same transaction
 *  - rejects the call if the card is inactive or has insufficient balance
 */
export async function debitGiftCard(
  giftCardId: string,
  amount: number,
  orderId: string,
): Promise<DebitResult> {
  if (amount <= 0) throw new ConflictError("Debit amount must be positive");

  const { data, error } = await supabaseAdmin()
    .rpc("debit_gift_card", {
      p_gift_card_id: giftCardId,
      p_amount: amount,
      p_order_id: orderId,
    })
    .single();

  if (error) {
    // Surface the SQL error message directly (it already describes the failure).
    throw new ConflictError(error.message);
  }
  const row = data as { new_balance: number; amount_debited: number; status: string };
  return {
    newBalance: Number(row.new_balance),
    amountDebited: Number(row.amount_debited),
    status: row.status,
  };
}

export async function creditGiftCard(opts: {
  code: string;
  amount: number;
  currency: Currency;
  orderId: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  expiresAt?: string;
}) {
  const { data, error } = await supabaseAdmin()
    .from("gift_cards")
    .insert({
      code: opts.code,
      initial_balance: opts.amount,
      current_balance: opts.amount,
      currency: opts.currency,
      purchaser_order_id: opts.orderId,
      recipient_email: opts.recipientEmail,
      recipient_name: opts.recipientName ?? null,
      message: opts.message ?? null,
      expires_at: opts.expiresAt ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create gift card: ${error.message}`);

  await supabaseAdmin().from("gift_card_transactions").insert({
    gift_card_id: data.id,
    order_id: opts.orderId,
    amount: opts.amount,
    type: "credit",
  });

  return data.id as string;
}
