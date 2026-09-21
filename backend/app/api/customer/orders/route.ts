/**
 * GET  /api/customer/orders                 — all orders for the signed-in customer
 * GET  /api/customer/orders?order_number=…  — one order (authenticated, or guest with email)
 * GET  /api/customer/orders?order_id=…      — one order by UUID (authenticated only)
 * POST /api/customer/orders/lookup          — guest lookup (email + order_number)
 *
 * Signed-in customers are identified by the `customer_token` cookie only;
 * guests must present both email and order number. A bare order id is never
 * enough to read an order.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `orders-lookup:${ip}`);
  if (!success) throw new RateLimitError();

  const authCustomer = await getAuthenticatedCustomer();
  const url = new URL(req.url);
  const emailParam = url.searchParams.get("email");
  const orderNumber = url.searchParams.get("order_number");
  const orderId = url.searchParams.get("order_id");

  if (authCustomer) {
    const customerEmail = authCustomer.email.toLowerCase();
    if (orderId) {
      if (!UUID_RE.test(orderId)) {
        return Response.json({ error: "Invalid order id" }, { status: 400 });
      }
      return lookupById(customerEmail, orderId);
    }
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

  if (orderId) {
    // Order ids are opaque — require a session to read by id.
    return Response.json({ error: "Sign in to view this order" }, { status: 401 });
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

const ORDER_SELECT = `
  id, order_number, customer_email, customer_phone, currency, subtotal, discount_total,
  gift_card_total, shipping_total, tax_total, total,
  payment_status, fulfillment_status, created_at,
  shipping_address_id, billing_address_id,
  order_items (id, product_id, variant_id, quantity, unit_price, line_total,
               product_snapshot),
  order_events (event_type, created_at, metadata)
`;

/** Join the shipping address and customer profile, and derive tracking info
 *  from the latest 'shipped' order event. */
async function enrich(order: Record<string, unknown>) {
  const shippingAddressId = typeof order.shipping_address_id === "string" ? order.shipping_address_id : null;
  const customerEmail = String(order.customer_email ?? "");

  const [addrRes, custRes] = await Promise.all([
    shippingAddressId
      ? supabaseAdmin()
          .from("addresses")
          .select("first_name, last_name, phone, street, city, state, postal_code, country")
          .eq("id", shippingAddressId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin()
      .from("customers")
      .select("first_name, last_name, phone")
      .eq("email", customerEmail)
      .maybeSingle(),
  ]);

  const events = (order.order_events ?? []) as Array<{
    event_type: string;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
  const shipped = events
    .filter((e) => e.event_type === "shipped")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

  return {
    ...order,
    shipping_address: addrRes.data ?? null,
    customer: custRes.data ?? null,
    tracking_carrier: shipped?.metadata?.carrier ?? null,
    tracking_number: shipped?.metadata?.tracking_number ?? null,
  };
}

async function lookup(email: string, orderNumber: string) {
  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_email", email)
    .eq("order_number", orderNumber)
    .single();
  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  return ok(await enrich(order));
}

async function lookupById(email: string, orderId: string) {
  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_email", email)
    .eq("id", orderId)
    .single();
  if (error || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  return ok(await enrich(order));
}
