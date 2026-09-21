/**
 * POST /api/admin/orders/[id]/deliver
 * Calls markDeliveredAction (sends orderDelivered email).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { actionResponse } from "@/lib/responses";
import { markDeliveredAction } from "@/app/admin/actions/orders";

export const POST = asyncHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const out = await markDeliveredAction(id);
  return actionResponse(out);
});
