/**
 * POST /api/admin/orders/[id]/refund
 * Body: { amount: number, restock?: boolean, reason?: string }
 * Calls refundOrderAction (which calls the gateway).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { refundOrderAction } from "@/app/admin/actions/orders";

const schema = z.object({
  amount: z.number().positive(),
  restock: z.boolean().optional().default(true),
  reason: z.string().max(500).optional(),
});

export const POST = asyncHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Invalid refund payload", 400, parsed.error.flatten());
  }
  try {
    const out = await refundOrderAction(id, parsed.data);
    return ok(out);
  } catch (err) {
    return fail((err as Error).message, 400);
  }
});
