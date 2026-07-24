/**
 * PATCH  /api/admin/products/:id/variants/:vid  — update variant
 * DELETE /api/admin/products/:id/variants/:vid  — hard delete
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

type Ctx = { params: Promise<{ id: string; vid: string }> };

const updateSchema = z.object({
  sku: z.string().min(1).max(80).optional(),
  barcode: z.string().max(80).optional().nullable(),
  price_override_ngn: z.number().nonnegative().optional().nullable(),
  price_override_usd: z.number().nonnegative().optional().nullable(),
  weight_grams: z.number().int().nonnegative().optional().nullable(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id, vid } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("product_variants")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", vid)
    .eq("product_id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Variant not found");

  await writeAudit(admin, {
    action: "UPDATE_VARIANT",
    entityType: "product_variant",
    entityId: data.id,
    metadata: parsed.data,
  });
  revalidatePath("/admin/products");
  return ok({ id: data.id });
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id, vid } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("product_variants")
    .delete()
    .eq("id", vid)
    .eq("product_id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Variant not found");
  await writeAudit(admin, { action: "DELETE_VARIANT", entityType: "product_variant", entityId: data.id });
  revalidatePath("/admin/products");
  return ok({ id: data.id });
});
