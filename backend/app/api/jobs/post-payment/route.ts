/**
 * POST /api/jobs/post-payment
 *
 * Background job endpoint for post-payment processing.
 * Can be triggered via QStash, internal webhooks, or admin actions.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { executePostPayment } from "@/lib/orders/post-payment";

const bodySchema = z.object({
  reference: z.string().min(1),
  gateway: z.enum(["stripe"]).default("stripe"),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("upstash-signature");
  const raw = await req.text();
  const isSigned = await verifyQStashSignature(signature, raw);

  if (!isSigned && process.env.NODE_ENV === "production" && process.env.QSTASH_TOKEN) {
    return new Response("Invalid signature", { status: 401 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return Response.json({ error: "Invalid job payload" }, { status: 400 });
  }

  const { reference, gateway } = parsed.data;
  const result = await executePostPayment(reference, gateway);

  return Response.json(result);
});
