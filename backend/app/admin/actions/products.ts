"use server";

/**
 * Admin product Server Actions.
 *
 * - `createProduct`, `updateProduct`, `softDeleteProduct`
 * - `createVariant`, `updateVariant`
 * - `addProductMedia`, `removeProductMedia`
 *
 * All actions check RBAC permissions and log to `audit_logs`.
 * Algolia is kept in sync on every mutation.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { productCreateSchema, productUpdateSchema, variantCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils/slug";
import { upsertProduct, deleteProduct, partialUpdateProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { safeAction, type ActionResult } from "@/lib/handler";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

export async function createProductAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("create");
    const parsed = productCreateSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin()
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) throw new ConflictError("Slug already in use");

    const { data: product, error } = await supabaseAdmin()
      .from("products")
      .insert({ ...data, slug })
      .select("id, slug, name, is_active, is_featured, is_new, is_bestseller, base_price_ngn, base_price_usd, brand_id, category_id, description")
      .single();
    if (error || !product) throw new Error(error?.message ?? "Insert failed");

    await audit(admin, "CREATE_PRODUCT", "product", product.id, { slug });
    await upsertProduct({
      objectID: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      base_price_ngn: Number(product.base_price_ngn),
      base_price_usd: Number(product.base_price_usd),
      brand_id: product.brand_id,
      category_id: product.category_id,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_bestseller: product.is_bestseller,
      in_stock: true,
      total_stock: 0,
      primary_image: null,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    });
    await cacheInvalidate("products:list:");
    await cacheInvalidate("product:slug:");
    revalidatePath("/admin/products");
    return { id: product.id, slug: product.slug };
  });
}

export async function updateProductAction(
  productId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update");
    const parsed = productUpdateSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);

    const { data, error } = await supabaseAdmin()
      .from("products")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select("id, slug, name, description, is_active, is_featured, is_new, is_bestseller, base_price_ngn, base_price_usd, brand_id, category_id")
      .single();
    if (error || !data) throw new NotFoundError("Product not found");

    await audit(admin, "UPDATE_PRODUCT", "product", data.id, parsed.data);
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
    await cacheInvalidate(`product:slug:${data.slug}`);
    await cacheInvalidate("products:list:");
    revalidatePath("/admin/products");
    revalidatePath(`/product/${data.slug}`);
    return { id: data.id };
  });
}

export async function softDeleteProductAction(productId: string): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("delete");
    const { data, error } = await supabaseAdmin()
      .from("products")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", productId)
      .select("id, slug")
      .single();
    if (error || !data) throw new NotFoundError("Product not found");

    await audit(admin, "SOFT_DELETE_PRODUCT", "product", data.id);
    await partialUpdateProduct(data.id, { is_active: false });
    await cacheInvalidate(`product:slug:${data.slug}`);
    revalidatePath("/admin/products");
    return { id: data.id };
  });
}

export async function hardDeleteProductAction(productId: string): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("delete");
    const { error } = await supabaseAdmin().from("products").delete().eq("id", productId);
    if (error) throw new Error(error.message);
    await deleteProduct(productId);
    await audit(admin, "HARD_DELETE_PRODUCT", "product", productId);
    revalidatePath("/admin/products");
    return { id: productId };
  });
}

export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  return safeAction(async () => {
    const admin = await checkPermission("update_products");
    const { data, error } = await supabaseAdmin()
      .from("products")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select("id, slug")
      .single();
    if (error || !data) throw new NotFoundError("Product not found");
    await audit(admin, "TOGGLE_PRODUCT_ACTIVE", "product", data.id, { is_active: isActive });
    await partialUpdateProduct(data.id, { is_active: isActive });
    await cacheInvalidate(`product:slug:${data.slug}`);
    revalidatePath("/admin/products");
    revalidatePath(`/product/${data.slug}`);
    return { id: data.id, is_active: isActive };
  });
}

const variantUpdateSchema = z.object({
  sku: z.string().min(1).max(80).optional(),
  barcode: z.string().max(80).optional().nullable(),
  price_override_ngn: z.number().nonnegative().optional().nullable(),
  price_override_usd: z.number().nonnegative().optional().nullable(),
  weight_grams: z.number().int().nonnegative().optional().nullable(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
});

export async function createVariantAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("create");
    const parsed = variantCreateSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { options, ...variantData } = parsed.data;

    const { data: variant, error } = await supabaseAdmin()
      .from("product_variants")
      .insert(variantData)
      .select("id, sku")
      .single();
    if (error || !variant) throw new Error(error?.message ?? "Insert failed");

    if (options.length > 0) {
      await supabaseAdmin()
        .from("variant_options")
        .insert(options.map((o) => ({ ...o, variant_id: variant.id })));
    }

    await audit(admin, "CREATE_VARIANT", "product_variant", variant.id, { sku: variant.sku });
    revalidatePath("/admin/products");
    return { id: variant.id };
  });
}

export async function updateVariantAction(
  variantId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update");
    const parsed = variantUpdateSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("product_variants")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", variantId)
      .select("id")
      .single();
    if (error || !data) throw new NotFoundError("Variant not found");
    await audit(admin, "UPDATE_VARIANT", "product_variant", data.id, parsed.data);
    revalidatePath("/admin/products");
    return { id: data.id };
  });
}

const mediaSchema = z.object({
  product_id: z.string().uuid(),
  url: z.string().url(),
  alt_text: z.string().max(200).optional().nullable(),
  position: z.number().int().default(0),
  is_primary: z.boolean().default(false),
  type: z.enum(["image", "video"]).default("image"),
});

export async function addProductMediaAction(raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("create");
    const parsed = mediaSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("product_media")
      .insert(parsed.data)
      .select("id, url, is_primary")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed");

    // If this is primary, unset the previous primary
    if (data.is_primary) {
      await supabaseAdmin()
        .from("product_media")
        .update({ is_primary: false })
        .eq("product_id", parsed.data.product_id)
        .neq("id", data.id);
    }

    await audit(admin, "ADD_PRODUCT_MEDIA", "product_media", data.id);
    if (data.is_primary) {
      await partialUpdateProduct(parsed.data.product_id, { primary_image: data.url });
    }
    revalidatePath("/admin/products");
    return { id: data.id };
  });
}

export async function removeProductMediaAction(mediaId: string) {
  return safeAction(async () => {
    const admin = await checkPermission("delete");
    const { data, error } = await supabaseAdmin()
      .from("product_media")
      .delete()
      .eq("id", mediaId)
      .select("id, product_id, is_primary, url")
      .single();
    if (error || !data) throw new NotFoundError("Media not found");
    await audit(admin, "REMOVE_PRODUCT_MEDIA", "product_media", data.id);
    if (data.is_primary) await partialUpdateProduct(data.product_id, { primary_image: null });
    revalidatePath("/admin/products");
    return { id: data.id };
  });
}
