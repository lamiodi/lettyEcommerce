/**
 * POST /api/admin/orders/[id]/cancel
 * Body: {}
 * Calls cancelOrderAction.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { cancelOrderAction } from "@/app/admin/actions/orders";

export const POST = asyncHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  try {
    const out = await cancelOrderAction(id);
    return ok(out);
  } catch (err) {
    return fail((err as Error).message, 400);
  }
});
