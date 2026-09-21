/**
 * POST /api/cart/track
 *
 * Upserts an anonymous shopper's cart into `abandoned_carts`, keyed by a
 * client-generated recovery_token (persisted in the shopper's localStorage).
 * An empty cart deletes the row — this is what the abandonment pipeline was
 * missing: the reminder cron and the /cart?ref=TOKEN recovery flow had no
 * writer, so no abandoned cart was ever recorded.
 *
 * Public + rate-limited. Email is optional and only attached when the
 * shopper is signed in (or typed it during checkout).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit, RateLimitError } from "@/lib/ratelimit";
import { corsHeaders } from "@/lib/cors";
import { getAuthenticatedCustomer } from "@/lib/auth/customer";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  recovery_token: z.string().min(16).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email().max(254).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"]).optional(),
  subtotal: z.number().nonnegative().max(1_000_000).optional(),
  cart: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .max(50)
    .default([]),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";
  const { success } = await enforceRateLimit("public", `cart-track:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid cart payload" },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { recovery_token, email, currency, subtotal, cart } = parsed.data;

  // Empty cart: the shopper finished checkout or emptied their bag —
  // remove the row so no reminder is ever sent for a converted cart.
  if (cart.length === 0) {
    const { error } = await supabaseAdmin()
      .from("abandoned_carts")
      .delete()
      .eq("recovery_token", recovery_token);
    if (error) logger.error({ error }, "cart-track: delete failed");
    return ok({ tracked: false });
  }

  // Prefer the session email over the body-supplied one.
  const authCustomer = await getAuthenticatedCustomer();
  const customerEmail = authCustomer?.email ?? email ?? null;

  const { error } = await supabaseAdmin()
    .from("abandoned_carts")
    .upsert(
      {
        recovery_token,
        customer_email: customerEmail,
        cart: cart.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        currency: currency ?? null,
        subtotal: subtotal ?? null,
      },
      { onConflict: "recovery_token", ignoreDuplicates: false },
    );
  if (error) {
    logger.error({ error }, "cart-track: upsert failed");
    return Response.json(
      { error: "Failed to save cart" },
      { status: 500, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  return ok({ tracked: true });
});
