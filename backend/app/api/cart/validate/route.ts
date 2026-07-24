/**
 * POST /api/cart/validate
 * Pre-checkout cart validation: returns priced cart, shipping options, tax.
 * Optionally accepts a `coupon_code` and/or `gift_card_code` to discount the
 * totals and report the resulting prices. Does not persist anything — the
 * real discount is applied atomically during checkout init.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { priceCart } from "@/lib/cart/pricing";
import { calculateShipping } from "@/lib/shipping/calculator";
import { priceColumn } from "@/lib/utils/price-columns";
import { supabaseAdmin } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/cors";
import { validateCoupon } from "@/lib/coupons/manager";
import { validateGiftCard } from "@/lib/giftcards/manager";
import { ConflictError } from "@/lib/errors";

const bodySchema = z.object({
  cart: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1)
    .max(50),
  country: z.string().length(2),
  state: z.string().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"]),
  coupon_code: z.string().min(1).max(64).optional(),
  gift_card_code: z.string().min(1).max(64).optional(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { cart, country, state, currency, coupon_code, gift_card_code } = parsed.data;

  const pricing = await priceCart({ cart, currency, country, state });

  // List available shipping methods for the country
  const { data: zones } = await supabaseAdmin()
    .from("shipping_zones")
    .select("id, countries")
    .eq("is_active", true);
  const zone = (zones ?? []).find((z) =>
    ((z.countries as string[]) ?? []).map((c) => c.toUpperCase()).includes(country.toUpperCase()),
  );
  let shippingOptions: Array<{
    id: string;
    name: string;
    rate: number;
    estimated_days: string | null;
    free_over: number | null;
  }> = [];
  if (zone) {
    const rateCol = priceColumn("rate", currency);
    const freeCol = priceColumn("free_over", currency);
    const { data: methods } = await supabaseAdmin()
      .from("shipping_methods")
      .select(
        `id, name, estimated_days, position, is_active, ${rateCol}, ${freeCol}`,
      )
      .eq("zone_id", zone.id)
      .eq("is_active", true)
      .order("position", { ascending: true });
    shippingOptions = (methods ?? []).map((m) => {
      const row = m as Record<string, unknown> & {
        id: string;
        name: string;
        estimated_days: string | null;
      };
      return {
        id: row.id,
        name: row.name,
        rate: Number(row[rateCol] ?? 0),
        estimated_days: row.estimated_days,
        free_over: Number(row[freeCol] ?? 0) || null,
      };
    });
  }

  // M6: optional coupon / gift card validation. We attempt both in
  // sequence; failures are returned as `coupon_error` / `gift_card_error`
  // so the cart UI can show the message without breaking the rest of the
  // pricing response.
  let discount_total = 0;
  let gift_card_total = 0;
  let coupon_error: string | null = null;
  let gift_card_error: string | null = null;

  if (coupon_code) {
    try {
      const coupon = await validateCoupon({
        code: coupon_code,
        subtotal: pricing.subtotal,
        currency,
        cartItems: cart,
      });
      discount_total = Math.min(coupon.discountAmount, pricing.subtotal);
    } catch (err) {
      coupon_error = err instanceof ConflictError ? err.message : "Invalid coupon";
    }
  }

  if (gift_card_code) {
    try {
      const gift = await validateGiftCard(gift_card_code, currency);
      const remainingAfterCoupon = Math.max(0, pricing.subtotal - discount_total);
      gift_card_total = Math.min(gift.currentBalance, remainingAfterCoupon);
    } catch (err) {
      gift_card_error = err instanceof ConflictError ? err.message : "Invalid gift card";
    }
  }

  return ok({
    items: pricing.items,
    subtotal: pricing.subtotal,
    currency,
    country,
    state,
    tax: pricing.tax,
    shipping_options: shippingOptions,
    discounts: {
      coupon_code: coupon_code ?? null,
      coupon_error,
      discount_total,
      gift_card_code: gift_card_code ?? null,
      gift_card_error,
      gift_card_total,
    },
  });
});
