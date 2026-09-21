/**
 * POST /api/jobs/post-payment
 *
 * Background job endpoint for post-payment processing.
 * Can be triggered via QStash, internal webhooks, or admin actions.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { executePostPayment } from "@/lib/orders/post-payment";

const bodySchema = z.object({
  reference: z.string().min(1),
  gateway: z.enum(["stripe"]).default("stripe"),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const raw = await req.text();
  if (!(await isAuthorizedJobCall(req))) {
    return new Response("Unauthorized", { status: 401 });
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
