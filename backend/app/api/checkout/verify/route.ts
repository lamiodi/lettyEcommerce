/**
 * GET /api/checkout/verify?reference=...&gateway=stripe|paystack
 *
 * For Paystack, the customer is redirected back to this URL after authorization.
 * For Stripe, the client confirms the payment via Stripe.js — but this endpoint
 * can also be polled for status.
 *
 * In both cases, the function verifies with the gateway and (if successful)
 * marks the order as paid and enqueues the post-payment job.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkoutVerifySchema } from "@/lib/validations";
import { verifyTransaction } from "@/lib/payments/paystack";
import { stripe } from "@/lib/payments/stripe";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { publishJob } from "@/lib/queue/qstash";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const parsed = checkoutVerifySchema.safeParse({
    reference: url.searchParams.get("reference"),
    gateway: url.searchParams.get("gateway") ?? "stripe",
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid verification request" },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const { reference, gateway } = parsed.data;

  // Look up the order first
  const { data: order } = await supabaseAdmin()
    .from("orders")
    .select("id, order_number, payment_status, customer_email, currency, total")
    .eq("payment_reference", reference)
    .single();
  if (!order) throw new NotFoundError("Order not found");

  if (order.payment_status === "paid") {
    return ok({ status: "paid", order_id: order.id, order_number: order.order_number });
  }

  let success = false;
  let payload: Record<string, unknown> = { reference };

  if (gateway === "paystack") {
    const tx = await verifyTransaction(reference);
    success = tx.status === "success";
    payload = { ...payload, ...tx, source: "paystack" };
  } else {
    const intent = await stripe().paymentIntents.retrieve(reference);
    success = intent.status === "succeeded";
    payload = {
      ...payload,
      payment_intent_id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      source: "stripe",
    };
  }

  if (success) {
    await markOrderPaid(reference, { source: gateway });
    await publishJob(`/api/jobs/post-payment`, { reference, gateway });
    return ok({ status: "paid", order_id: order.id, order_number: order.order_number });
  }

  await markOrderFailed(reference, "verification_failed");
  return ok({ status: "failed", order_id: order.id });
});
