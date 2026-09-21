/**
 * POST /api/checkout/confirm
 *
 * Client-facing confirmation endpoint after Stripe.js confirmPayment succeeds.
 * Accepts { orderId, paymentIntentId } or { reference }.
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
  const reference = body.paymentIntentId || body.reference;
  const orderId = body.orderId;

  if (!reference) {
    throw new BadRequestError("paymentIntentId or reference is required");
  }

  // Look up order by payment_reference or orderId
  let q = supabaseAdmin()
    .from("orders")
    .select("id, order_number, payment_status, customer_email, currency, total, payment_reference");

  if (reference) {
    q = q.eq("payment_reference", reference);
  }

  const { data: order } = await q.maybeSingle();
  let matchedOrder = order;

  if (!matchedOrder && orderId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let idQuery = supabaseAdmin()
      .from("orders")
      .select("id, order_number, payment_status, customer_email, currency, total, payment_reference");
    
    if (isUuid) {
      idQuery = idQuery.or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } else {
      idQuery = idQuery.eq("order_number", orderId);
    }
    const { data: byId } = await idQuery.maybeSingle();
    matchedOrder = byId;
  }

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

  await markOrderFailed(effectiveRef, "confirmation_failed");
  return ok(
    { status: "failed", order_id: matchedOrder.id, order_number: matchedOrder.order_number },
    { headers: corsHeaders(origin) },
  );
});
