/**
 * POST /api/admin/orders/[id]/ship
 * Body: { carrier, tracking_number }
 * Calls markShippedAction (sends orderShipped email).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { markShippedAction } from "@/app/admin/actions/orders";

const schema = z.object({
  carrier: z.string().min(1).max(80),
  tracking_number: z.string().min(1).max(120),
});

export const POST = asyncHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Invalid ship payload", 400, parsed.error.flatten());
  }
  try {
    const out = await markShippedAction(id, parsed.data);
    return ok(out);
  } catch (err) {
    return fail((err as Error).message, 400);
  }
});
