/**
 * POST /api/jobs/order-expiry
 * Cancels stale pending orders and releases their inventory
 * reservations. Schedule every 15 minutes.
 *
 * A shopper who reaches the payment step and closes the tab never
 * triggers a webhook — without this sweep their reservation leaks
 * forever and the variant slowly becomes unbuyable. Before expiring
 * an order the PaymentIntent is checked with Stripe, so payments
 * that are still settling (or a webhook that was missed entirely)
 * are finalized instead of cancelled.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { stripe } from "@/lib/payments/stripe";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { executePostPayment } from "@/lib/orders/post-payment";
import { logger } from "@/lib/logger";

const EXPIRY_MINUTES = 60;
const BATCH_LIMIT = 25;

export const POST = asyncHandler(async (req: NextRequest) => {
  if (!(await isAuthorizedJobCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60_000).toISOString();
  const { data: stale, error } = await supabaseAdmin()
    .from("orders")
    .select("id, order_number, payment_reference")
    .eq("payment_status", "pending")
    .not("payment_reference", "is", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);
  if (error) {
    logger.error({ error }, "order-expiry: load failed");
    return Response.json({ ok: false }, { status: 500 });
  }

  let expired = 0;
  let healed = 0;
  let skipped = 0;

  for (const order of stale ?? []) {
    try {
      const intent = await stripe().paymentIntents.retrieve(order.payment_reference!);

      if (intent.status === "succeeded") {
        // The webhook was missed — finalize instead of expiring.
        await markOrderPaid(
          intent.id,
          { source: "order_expiry_sweep" },
          { amountMinor: intent.amount, currency: intent.currency, livemode: intent.livemode },
        );
        await executePostPayment(intent.id, "stripe");
        healed++;
        continue;
      }

      if (intent.status === "processing") {
        // Async method (e.g. Klarna) still settling — leave it alone;
        // the webhook (or a later sweep) will finalize it.
        skipped++;
        continue;
      }

      // requires_payment_method / requires_confirmation / requires_action /
      // canceled: the shopper is gone. Cancel the intent so a late device
      // confirmation cannot charge a released order, then fail + release.
      if (intent.status !== "canceled") {
        try {
          await stripe().paymentIntents.cancel(order.payment_reference!);
        } catch (cancelErr) {
          // Lost a race with a confirmation — re-check before expiring.
          const reread = await stripe().paymentIntents.retrieve(order.payment_reference!);
          if (reread.status === "succeeded" || reread.status === "processing") {
            skipped++;
            continue;
          }
          logger.warn({ cancelErr, orderId: order.id }, "order-expiry: cancel intent failed");
        }
      }

      await markOrderFailed(order.payment_reference!, "checkout_expired");
      expired++;
    } catch (err) {
      logger.warn({ err, orderId: order.id }, "order-expiry: order skipped after error");
      skipped++;
    }
  }

  return Response.json({
    ok: true,
    scanned: stale?.length ?? 0,
    expired,
    healed,
    skipped,
  });
});
