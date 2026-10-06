/**
 * POST /api/checkout/confirm
 *
 * Client-facing confirmation endpoint after Stripe.js confirmPayment succeeds.
 * Accepts { paymentIntentId } or { reference } — the unguessable Stripe
 * reference only. Bare order numbers are deliberately not resolved here:
 * that would let anyone fail a stranger's pending order and release its
 * stock, coupon use and gift-card debit.
 *
 * Validates Stripe payment intent directly with Stripe API, enforces currency/amount matching,
 * transitions order status to 'paid', and executes post-payment pipeline.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { stripe } from "@/lib/payments/stripe";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { executePostPayment } from "@/lib/orders/post-payment";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError, BadRequestError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const body = await req.json().catch(() => ({}));
  const reference: string | undefined = body.paymentIntentId || body.reference;

  if (!reference) {
    throw new BadRequestError("paymentIntentId or reference is required");
  }

  // Look up order by payment_reference. Never by orderId/order_number —
  // those are guessable and this endpoint fails orders (see header).
  const { data: matchedOrder } = await supabaseAdmin()
    .from("orders")
    .select("id, order_number, payment_status, customer_email, currency, total, payment_reference")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!matchedOrder) {
    throw new NotFoundError("Order not found");
  }

  const effectiveRef = matchedOrder.payment_reference || reference;

  if (matchedOrder.payment_status === "paid") {
    return ok(
      { status: "paid", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
      { headers: corsHeaders(origin) },
    );
  }

  // Synthetic reference (a gift card covered the whole order): there is no
  // PaymentIntent to retrieve — report the stored state.
  if (!effectiveRef.startsWith("pi_")) {
    return ok(
      {
        status: matchedOrder.payment_status,
        order_id: matchedOrder.id,
        order_number: matchedOrder.order_number,
      },
      { headers: corsHeaders(origin) },
    );
  }

  const intent = await stripe().paymentIntents.retrieve(effectiveRef);
  const success = intent.status === "succeeded";

  if (success) {
    await markOrderPaid(
      effectiveRef,
      { source: "stripe_confirm", livemode: intent.livemode },
      {
        amountMinor: intent.amount,
        currency: intent.currency,
        livemode: intent.livemode,
      },
    );
    await executePostPayment(effectiveRef, "stripe");
    return ok(
      { status: "paid", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
      { headers: corsHeaders(origin) },
    );
  }

  // Asynchronous / off-session methods settle later — do not fail the order
  // while the charge is still in flight (the webhook will finalize it).
  if (intent.status === "processing" || intent.status === "requires_action") {
    return ok(
      { status: "processing", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
      { headers: corsHeaders(origin) },
    );
  }

  // requires_payment_method / requires_confirmation are normal pre-payment
  // states — the shopper may still be filling the form or confirming. Never
  // release stock or entitlements for them (same invariant as /verify); the
  // expiry sweep fails genuinely abandoned orders.
  if (intent.status !== "canceled") {
    return ok(
      { status: "pending", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
      { headers: corsHeaders(origin) },
    );
  }

  await markOrderFailed(effectiveRef, "confirmation_failed");
  return ok(
    { status: "failed", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
    { headers: corsHeaders(origin) },
  );
});
