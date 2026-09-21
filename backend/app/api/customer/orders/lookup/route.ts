/**
 * POST & GET /api/customer/orders/lookup
 *
 * Dedicated endpoint for guest and authenticated customer order tracking by order_number.
 * Supports case-insensitive order number matching.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";
import { getAuthenticatedCustomer } from "@/lib/auth/customer";

const lookupSchema = z.object({
  email: z.string().email(),
  order_number: z.string().min(1),
});

async function performOrderLookup(email: string, rawOrderNumber: string) {
  const cleanEmail = email.trim().toLowerCase();
  // Order numbers are machine-generated uppercase (LETY-YYYYMMDD-XXXX).
  // Normalizing + exact match hits the UNIQUE index on order_number — an
  // ILIKE here would force a full table scan on every public lookup.
  const cleanOrderNumber = rawOrderNumber.trim().toUpperCase();

  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(
      `
        id, order_number, customer_email, currency, subtotal, discount_total,
        gift_card_total, shipping_total, tax_total, total,
        payment_status, fulfillment_status, created_at,
        shipping_address:shipping_address_id (*),
        order_items (
          id, product_id, variant_id, quantity, unit_price, line_total,
          product_snapshot
        ),
        order_events (event_type, created_at, metadata)
      `,
    )
    .eq("customer_email", cleanEmail)
    .eq("order_number", cleanOrderNumber)
    .maybeSingle();

  if (error || !order) {
    return null;
  }
  return order;
}

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const { success } = await enforceRateLimit("public", `orders-lookup:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => ({}));
  const orderNum = body.order_number || body.orderNumber || body.orderId;
  const email = body.email;

  const parsed = lookupSchema.safeParse({ email, order_number: orderNum });
  if (!parsed.success) {
    return fail("Please provide a valid email and order number", 400, parsed.error.flatten(), {
      headers: corsHeaders(origin),
    });
  }

  const authCustomer = await getAuthenticatedCustomer();
  if (authCustomer && authCustomer.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return fail("Order not found", 404, undefined, { headers: corsHeaders(origin) });
  }

  const order = await performOrderLookup(parsed.data.email, parsed.data.order_number);
  if (!order) {
    return fail("Order not found. Please verify your order number and email address.", 404, undefined, {
      headers: corsHeaders(origin),
    });
  }

  return ok(order, { headers: corsHeaders(origin) });
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const { success } = await enforceRateLimit("public", `orders-lookup:${ip}`);
  if (!success) throw new RateLimitError();

  const url = new URL(req.url);
  const emailParam = url.searchParams.get("email");
  const orderNumber = url.searchParams.get("order_number") || url.searchParams.get("orderNumber");

  if (!emailParam || !orderNumber) {
    return fail("email and order_number are required query parameters", 400, undefined, {
      headers: corsHeaders(origin),
    });
  }

  const order = await performOrderLookup(emailParam, orderNumber);
  if (!order) {
    return fail("Order not found", 404, undefined, { headers: corsHeaders(origin) });
  }

  return ok(order, { headers: corsHeaders(origin) });
});

export const OPTIONS = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
