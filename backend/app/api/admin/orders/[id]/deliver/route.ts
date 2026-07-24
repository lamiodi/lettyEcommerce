/**
 * POST /api/admin/orders/[id]/deliver
 * Calls markDeliveredAction (sends orderDelivered email).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { markDeliveredAction } from "@/app/admin/actions/orders";

export const POST = asyncHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  try {
    const out = await markDeliveredAction(id);
    return ok(out);
  } catch (err) {
    return fail((err as Error).message, 400);
  }
});
