/**
 * GET    /api/admin/products/:id      — product + variants + media
 * PATCH  /api/admin/products/:id      — update product
 * DELETE /api/admin/products/:id      — soft-delete
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { partialUpdateProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  await checkPermission("read");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select(
      `*,
       brand:brands(id, name, slug),
       category:categories(id, name, slug),
       product_media (id, url, alt_text, position, is_primary, type, created_at),
       product_variants (
         id, sku, barcode, price_override_ngn, price_override_usd,
         weight_grams, stock_quantity, reserved_quantity, low_stock_threshold,
         is_active, position,
         variant_options (id, option_name, option_value)
       )`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .order("position", { foreignTable: "product_variants", ascending: true })
    .order("position", { foreignTable: "product_media", ascending: true })
    .single();
  if (error || !data) throw new NotFoundError("Product not found");
  return ok(data);
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  short_description: z.string().max(400).nullable().optional(),
  base_price_ngn: z.number().nonnegative().optional(),
  base_price_usd: z.number().nonnegative().optional(),
  compare_at_price_ngn: z.number().nonnegative().nullable().optional(),
  compare_at_price_usd: z.number().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const updates = { ...parsed.data, updated_at: new Date().toISOString() };

  const { data, error } = await supabaseAdmin()
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(
      `id, slug, name, description, is_active, is_featured, is_new, is_bestseller,
       base_price_ngn, base_price_usd, brand_id, category_id`,
    )
    .single();
  if (error || !data) throw new NotFoundError("Product not found");

  await writeAudit(admin, {
    action: "UPDATE_PRODUCT",
    entityType: "product",
    entityId: data.id,
    metadata: parsed.data,
  });
  try {
    await partialUpdateProduct(data.id, {
      name: data.name,
      description: data.description,
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_new: data.is_new,
      is_bestseller: data.is_bestseller,
      base_price_ngn: Number(data.base_price_ngn),
      base_price_usd: Number(data.base_price_usd),
    });
  } catch {
    // Non-fatal.
  }
  await cacheInvalidate(`product:slug:${data.slug}`);
  await cacheInvalidate("products:list:");
  revalidatePath("/admin/products");
  revalidatePath(`/product/${data.slug}`);
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, slug")
    .single();
  if (error || !data) throw new NotFoundError("Product not found");
  await writeAudit(admin, { action: "SOFT_DELETE_PRODUCT", entityType: "product", entityId: data.id });
  try {
    await partialUpdateProduct(data.id, { is_active: false });
  } catch {
    // Non-fatal.
  }
  await cacheInvalidate(`product:slug:${data.slug}`);
  revalidatePath("/admin/products");
  return ok({ id: data.id, deleted_at: new Date().toISOString() });
});
