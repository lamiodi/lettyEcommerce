/**
 * POST /api/checkout/webhook/stripe
 * Stripe webhook receiver. Verifies the signature and triggers the
 * post-payment pipeline for `payment_intent.succeeded`.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyStripeWebhook } from "@/lib/payments/stripe";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { publishJob } from "@/lib/queue/qstash";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = verifyStripeWebhook(raw, signature);
  } catch (err) {
    logger.warn({ err }, "Stripe signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as { id: string; metadata: Record<string, string> };
      await markOrderPaid(intent.id, { source: "stripe" });
      await publishJob(`/api/jobs/post-payment`, { reference: intent.id, gateway: "stripe" });
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as { id: string; last_payment_error?: { message?: string } };
      await markOrderFailed(intent.id, intent.last_payment_error?.message ?? "payment_failed");
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as { payment_intent: string };
      logger.info({ payment_intent: charge.payment_intent }, "Refund webhook received");
      // Refund handling is left to the admin server action.
      break;
    }
    case "charge.dispute.created": {
      // Item 4.6: a chargeback was opened. Flag the order, freeze
      // fulfilment, and notify the owner inbox. We do NOT auto-refund —
      // a chargeback is the customer's claim against the merchant, and
      // a refund+dispute is a duplicate of funds. Owners must respond
      // via the Stripe dashboard.
      const dispute = event.data.object as {
        id: string;
        charge: string;
        amount: number;
        currency: string;
        reason: string;
      };
      logger.warn({ disputeId: dispute.id, charge: dispute.charge }, "Chargeback opened");
      const { data: order, error: oerr } = await supabaseAdmin()
        .from("orders")
        .update({
          fulfillment_status: "cancelled",
          internal_notes: `[dispute ${dispute.id}] ${dispute.reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", dispute.charge)
        .select("id, order_number, customer_email")
        .maybeSingle();
      if (oerr) {
        logger.error({ oerr, disputeId: dispute.id }, "chargeback: order update failed");
      } else if (order) {
        await supabaseAdmin().from("order_events").insert({
          order_id: order.id,
          event_type: "dispute_opened",
          metadata: { dispute_id: dispute.id, reason: dispute.reason, amount: dispute.amount, currency: dispute.currency },
        });
        await supabaseAdmin().from("admin_notifications").insert({
          type: "chargeback",
          title: `Chargeback on order ${order.order_number}`,
          body: `Reason: ${dispute.reason} — respond via Stripe dashboard.`,
          link: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders/${order.id}`,
          metadata: { order_id: order.id, dispute_id: dispute.id },
        });
      }
      break;
    }
    default:
      // Unhandled event types are no-ops
      break;
  }

  return Response.json({ received: true });
});
