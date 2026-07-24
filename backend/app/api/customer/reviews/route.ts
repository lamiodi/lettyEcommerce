/**
 * POST /api/customer/reviews
 * Create a review. Customers are matched by email + an order they own.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { created } from "@/lib/responses";
import { reviewCreateSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `reviews:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { product_id, rating, title, body: text, images } = parsed.data;

  // Optional: pass email + order_number to mark as a verified purchase
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const orderNumber = url.searchParams.get("order_number");
  let verified = false;
  let customerId: string | null = null;
  let orderId: string | null = null;

  if (email && orderNumber) {
    const { data: order } = await supabaseAdmin()
      .from("orders")
      .select("id, customer_id")
      .eq("customer_email", email)
      .eq("order_number", orderNumber)
      .eq("payment_status", "paid")
      .single();
    if (!order) throw new NotFoundError("Order not found or not paid");
    orderId = order.id;
    customerId = order.customer_id;
    const { data: item } = await supabaseAdmin()
      .from("order_items")
      .select("id")
      .eq("order_id", order.id)
      .eq("product_id", product_id)
      .maybeSingle();
    if (!item) throw new ConflictError("This product is not part of the order");
    verified = true;
  }

  // Prevent duplicates from the same customer / order
  if (orderId) {
    const { data: existing } = await supabaseAdmin()
      .from("reviews")
      .select("id")
      .eq("product_id", product_id)
      .eq("order_id", orderId)
      .maybeSingle();
    if (existing) throw new ConflictError("You already reviewed this product");
  }

  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .insert({
      product_id,
      customer_id: customerId,
      order_id: orderId,
      rating,
      title: title ?? null,
      body: text ?? null,
      images,
      verified_purchase: verified,
      is_approved: false, // admin moderation
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Notify admins for moderation
  await supabaseAdmin().from("admin_notifications").insert({
    type: "review_pending",
    entity_id: data.id,
    payload: { product_id, rating },
  });

  return Response.json(
    { data: { id: data.id, status: "pending_moderation" } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
