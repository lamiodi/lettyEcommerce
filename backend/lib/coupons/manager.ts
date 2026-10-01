/**
 * Coupon validation, application, and redemption.
 *
 * `apply_coupon` is atomic: it increments `times_used` inside the same
 * SQL transaction that validates usage limits. There is no separate
 * `redeemCoupon` function.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError } from "@/lib/errors";
import type { Currency } from "@/lib/validations";

export interface CouponValidation {
  couponId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  minSubtotal: number;
}

export interface CartItemForCoupon {
  variant_id: string;
  quantity: number;
}

export async function validateCoupon(opts: {
  code: string;
  subtotal: number;
  customerId?: string;
  currency: Currency;
  cartItems?: CartItemForCoupon[];
  /** false = validate without burning a use (used by /api/coupon/validate). */
  apply?: boolean;
}): Promise<CouponValidation> {
  let data: unknown = null;
  let error: { message: string } | null = null;

  try {
    const res = await supabaseAdmin().rpc("apply_coupon", {
      p_code: opts.code,
      p_subtotal: opts.subtotal,
      p_customer_id: opts.customerId ?? null,
      p_currency: opts.currency,
      p_cart_items: opts.cartItems ?? [],
      p_apply: opts.apply !== false,
    });
    data = res.data;
    error = (res.error as { message: string } | null) ?? null;
  } catch (err) {
    error = err instanceof Error ? { message: err.message } : { message: String(err) };
  }

  const rows = Array.isArray(data) ? (data as unknown[]) : [];
  if (error || rows.length === 0) {
    // The RPC throws on validation failure with a message we want to surface.
    throw new ConflictError(error?.message || "Invalid coupon code");
  }

  const row = rows[0] as {
    coupon_id: string;
    discount_type: "percentage" | "fixed";
    discount_value: string | number;
    discount_amount: string | number;
    min_subtotal: string | number;
  };
  return {
    couponId: row.coupon_id,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    discountAmount: Number(row.discount_amount),
    minSubtotal: Number(row.min_subtotal),
  };
}

/**
 * Rollback a coupon increment when the surrounding transaction (e.g. checkout
 * init) fails AFTER `apply_coupon` has already been called. The atomic
 * `apply_coupon` increments `times_used`; if downstream steps (inventory
 * reservation, payment init) fail, we must give the use back.
 */
export async function refundCouponUsage(couponId: string): Promise<void> {
  await supabaseAdmin().rpc("increment_coupon_usage_decrement", { p_coupon_id: couponId });
}
