/**
 * PATCH  /api/admin/brands/:id
 * DELETE /api/admin/brands/:id
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
import { slugify } from "@/lib/utils/slug";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  is_active: z.boolean().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.name) updates.slug = slugify(parsed.data.name);
  const { data, error } = await supabaseAdmin()
    .from("brands")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Brand not found");
  await writeAudit(admin, { action: "UPDATE_BRAND", entityType: "brand", entityId: data.id });
  revalidatePath("/admin/catalog");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("brands")
    .update({ is_active: false })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Brand not found");
  await writeAudit(admin, { action: "DEACTIVATE_BRAND", entityType: "brand", entityId: data.id });
  revalidatePath("/admin/catalog");
  return ok({ id: data.id });
});
