/**
 * POST /api/admin/orders/[id]/note
 * Body: { note: string }
 * Calls setInternalNoteAction.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok, fail } from "@/lib/responses";
import { setInternalNoteAction } from "@/app/admin/actions/orders";

const schema = z.object({
  note: z.string().max(4000),
});

export const POST = asyncHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Invalid note payload", 400, parsed.error.flatten());
  }
  try {
    const out = await setInternalNoteAction(id, parsed.data.note);
    return ok(out);
  } catch (err) {
    return fail((err as Error).message, 400);
  }
});
