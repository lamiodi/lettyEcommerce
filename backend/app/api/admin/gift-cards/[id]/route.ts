/**
 * PATCH  /api/admin/gift-cards/:id — void or change balance
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["active", "expired", "void"]).optional(),
  current_balance: z.number().nonnegative().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("gift_cards")
    .update(parsed.data)
    .eq("id", id)
    .select("id, status, current_balance")
    .single();
  if (error || !data) throw new NotFoundError("Gift card not found");
  await writeAudit(admin, { action: "UPDATE_GIFT_CARD", entityType: "gift_card", entityId: data.id, metadata: parsed.data });
  revalidatePath("/admin/gift-cards");
  return ok(data);
});
