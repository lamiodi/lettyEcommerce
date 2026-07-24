/**
 * PATCH  /api/admin/banners/:id
 * DELETE /api/admin/banners/:id
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
  title: z.string().min(1).max(120).optional(),
  subtitle: z.string().max(300).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
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
    .from("banners")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Banner not found");
  await writeAudit(admin, { action: "UPDATE_BANNER", entityType: "banner", entityId: data.id });
  revalidatePath("/admin/banners");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("banners")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Banner not found");
  await writeAudit(admin, { action: "DELETE_BANNER", entityType: "banner", entityId: data.id });
  revalidatePath("/admin/banners");
  return ok({ id: data.id });
});
