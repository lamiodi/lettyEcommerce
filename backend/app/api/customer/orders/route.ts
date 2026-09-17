/**
 * GET  /api/customer/orders?email=...
 * POST /api/customer/orders/lookup  (body: { email, order_number })
 *
 * Guest order lookup. Email + order_number is the access token.
 * No JWTs are issued to customers.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";
import { getAuthenticatedCustomer } from "@/lib/auth/customer";

export const GET = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `orders-lookup:${ip}`);
  if (!success) throw new RateLimitError();

  const authCustomer = await getAuthenticatedCustomer();
  const url = new URL(req.url);
  const emailParam = url.searchParams.get("email");
  const orderNumber = url.searchParams.get("order_number");

  if (authCustomer) {
    const customerEmail = authCustomer.email.toLowerCase();
    if (orderNumber) {
      return lookup(customerEmail, orderNumber);
    }
    // Return all orders for the authenticated customer
    const { data: orders, error } = await supabaseAdmin()
      .from("orders")
      .select(
        `
          id, order_number, customer_email, currency, subtotal, discount_total,
          gift_card_total, shipping_total, tax_total, total,
          payment_status, fulfillment_status, created_at,
          order_items (id, product_id, variant_id, quantity, unit_price, line_total, product_snapshot)
        `,
      )
      .eq("customer_email", customerEmail)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
    return ok(orders ?? []);
  }

  // Guest lookup: require both email and order_number
  const email = emailParam?.trim().toLowerCase();
  if (!email || !orderNumber) {
    return Response.json(
      { error: "email and order_number are required" },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  return lookup(email, orderNumber);
});

const bodySchema = z.object({ email: z.string().email(), order_number: z.string().min(1) });

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `orders-lookup:${ip}`);
  if (!success) throw new RateLimitError();
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const authCustomer = await getAuthenticatedCustomer();
  if (authCustomer && authCustomer.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return lookup(parsed.data.email.toLowerCase(), parsed.data.order_number);
});

async function lookup(email: string, orderNumber: string) {
  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(
      `
        id, order_number, customer_email, currency, subtotal, discount_total,
        gift_card_total, shipping_total, tax_total, total,
        payment_status, fulfillment_status, created_at,
        shipping_address_id, billing_address_id,
        order_items (id, product_id, variant_id, quantity, unit_price, line_total,
                     product_snapshot),
        order_events (event_type, created_at, metadata)
      `,
    )
    .eq("customer_email", email)
    .eq("order_number", orderNumber)
    .single();
  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  return ok(order);
}
