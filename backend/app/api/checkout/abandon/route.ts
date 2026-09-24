/**
 * POST /api/checkout/abandon
 *
 * The checkout client calls this after a failed confirmation to give
 * up on the order it just created, so the inventory reservation frees
 * immediately and an immediate retry isn't blocked by the shopper's
 * own pending order (waiting for the order-expiry sweep instead).
 *
 * Verifies the PaymentIntent with Stripe before failing anything —
 * it can never cancel an order whose payment actually went through.
 * Same trust model as /api/checkout/confirm (which also accepts a
 * bare reference); the orderId UUID is unguessable and the checkout
 * rate limit applies.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { stripe } from "@/lib/payments/stripe";
import { markOrderFailed } from "@/lib/orders/orchestrator";
import { supabaseAdmin } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const body = await req.json().catch(() => ({}));
  const reference: string | undefined = body.paymentIntentId || body.reference;
  const orderId: string | undefined = body.orderId;

  let effectiveRef = reference;
  if (!effectiveRef && orderId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let q = supabaseAdmin().from("orders").select("id, payment_reference");
    q = isUuid ? q.or(`id.eq.${orderId},order_number.eq.${orderId}`) : q.eq("order_number", orderId);
    const { data: order } = await q.maybeSingle();
    effectiveRef = order?.payment_reference ?? undefined;
  }

  if (!effectiveRef) {
    return ok({ status: "not_found" }, { headers: corsHeaders(origin) });
  }

  const intent = await stripe().paymentIntents.retrieve(effectiveRef);

  // Never touch an order that was paid or is still settling — the
  // webhook / confirm endpoint own those transitions.
  if (intent.status === "succeeded") {
    return ok({ status: "paid" }, { headers: corsHeaders(origin) });
  }
  if (intent.status === "processing") {
    return ok({ status: "processing" }, { headers: corsHeaders(origin) });
  }

  if (intent.status !== "canceled") {
    try {
      await stripe().paymentIntents.cancel(effectiveRef);
    } catch {
      // Lost a race with a confirmation — re-check before failing.
      const reread = await stripe().paymentIntents.retrieve(effectiveRef);
      if (reread.status === "succeeded" || reread.status === "processing") {
        return ok({ status: reread.status === "succeeded" ? "paid" : "processing" }, {
          headers: corsHeaders(origin),
        });
      }
    }
  }

  await markOrderFailed(effectiveRef, "customer_abandoned");
  return ok({ status: "abandoned" }, { headers: corsHeaders(origin) });
});
