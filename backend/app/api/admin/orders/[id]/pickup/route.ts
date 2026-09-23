/**
 * POST /api/admin/orders/[id]/pickup
 * Calls markReadyForPickupAction (sends orderReadyForPickup email matching Maison PDF 1).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { actionResponse } from "@/lib/responses";
import { markReadyForPickupAction } from "@/app/admin/actions/orders";

export const POST = asyncHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const out = await markReadyForPickupAction(id);
  return actionResponse(out);
});
