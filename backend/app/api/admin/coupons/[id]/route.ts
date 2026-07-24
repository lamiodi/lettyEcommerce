/**
 * GET    /api/admin/coupons/:id
 * PATCH  /api/admin/coupons/:id
 * DELETE /api/admin/coupons/:id — soft-delete
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

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  await checkPermission("read");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new NotFoundError("Coupon not found");
  return ok(data);
});

const numStr = z.union([z.number().nonnegative(), z.null()]).optional();

const updateSchema = z.object({
  code: z.string().min(1).max(40).transform((s) => s.toUpperCase().trim()).optional(),
  description: z.string().max(500).nullable().optional(),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().nonnegative().optional(),
  min_subtotal_ngn: z.number().nonnegative().optional(),
  min_subtotal_usd: z.number().nonnegative().optional(),
  min_subtotal_eur: z.number().nonnegative().optional(),
  min_subtotal_gbp: z.number().nonnegative().optional(),
  min_subtotal_ghs: z.number().nonnegative().optional(),
  min_subtotal_zar: z.number().nonnegative().optional(),
  min_subtotal_kes: z.number().nonnegative().optional(),
  max_discount_ngn: numStr,
  max_discount_usd: numStr,
  max_discount_eur: numStr,
  max_discount_gbp: numStr,
  max_discount_ghs: numStr,
  max_discount_zar: numStr,
  max_discount_kes: numStr,
  applies_to: z.enum(["all", "category", "product", "collection"]).optional(),
  applies_to_ids: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  usage_limit: z.number().int().nonnegative().nullable().optional(),
  usage_limit_per_customer: z.number().int().nonnegative().nullable().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.applies_to_ids) updates.applies_to_ids = JSON.stringify(parsed.data.applies_to_ids);
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .update(updates)
    .eq("id", id)
    .select("id, code")
    .single();
  if (error || !data) throw new NotFoundError("Coupon not found");
  await writeAudit(admin, { action: "UPDATE_COUPON", entityType: "coupon", entityId: data.id, metadata: parsed.data });
  revalidatePath("/admin/coupons");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Coupon not found");
  await writeAudit(admin, { action: "DELETE_COUPON", entityType: "coupon", entityId: data.id });
  revalidatePath("/admin/coupons");
  return ok({ id: data.id });
});
