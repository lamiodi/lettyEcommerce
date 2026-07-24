/**
 * POST /api/checkout/webhook/paystack
 * Paystack webhook receiver. Verifies HMAC SHA-512 signature.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyPaystackWebhook } from "@/lib/payments/paystack";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { publishJob } from "@/lib/queue/qstash";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();

  if (!verifyPaystackWebhook(raw, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const body = JSON.parse(raw) as {
    event: string;
    data: { reference: string; status: string; metadata?: Record<string, unknown> };
  };

  switch (body.event) {
    case "charge.success": {
      await markOrderPaid(body.data.reference, { source: "paystack" });
      await publishJob(`/api/jobs/post-payment`, {
        reference: body.data.reference,
        gateway: "paystack",
      });
      break;
    }
    case "charge.failed":
    case "charge.abandoned": {
      await markOrderFailed(body.data.reference, body.event);
      break;
    }
    case "refund.processed":
    case "refund.failed":
    case "dispute.create": {
      // Item 4.6: same handling as Stripe. For v1 we just log; a follow-up
      // job reconciles by polling Paystack.
      logger.warn({ event: body.event, data: body.data }, "Paystack dispute/refund event");
      break;
    }
    default:
      logger.debug({ event: body.event }, "Unhandled Paystack event");
  }

  return Response.json({ received: true });
});
