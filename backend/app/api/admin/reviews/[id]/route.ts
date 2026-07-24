/**
 * PATCH  /api/admin/reviews/:id — approve / unapprove
 * DELETE /api/admin/reviews/:id
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

const updateSchema = z.object({ is_approved: z.boolean() });

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .update({ is_approved: parsed.data.is_approved, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, is_approved, product_id")
    .single();
  if (error || !data) throw new NotFoundError("Review not found");
  await writeAudit(admin, {
    action: parsed.data.is_approved ? "APPROVE_REVIEW" : "UNAPPROVE_REVIEW",
    entityType: "review",
    entityId: data.id,
  });
  revalidatePath("/admin/reviews");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Review not found");
  await writeAudit(admin, { action: "DELETE_REVIEW", entityType: "review", entityId: data.id });
  revalidatePath("/admin/reviews");
  return ok({ id: data.id });
});
