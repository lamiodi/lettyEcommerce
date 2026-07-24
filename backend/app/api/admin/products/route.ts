/**
 * GET   /api/admin/products?query=&includeDeleted=&cursor=&limit=
 * POST  /api/admin/products        — create product
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError } from "@/lib/errors";
import { slugify } from "@/lib/utils/slug";
import { writeAudit } from "@/lib/audit";
import { upsertProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

const listQuerySchema = z.object({
  query: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  includeDeleted: z.coerce.boolean().default(false),
  status: z.enum(["active", "draft", "all"]).default("all"),
  brand_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const { query, cursor, limit, includeDeleted, status, brand_id, category_id } = parsed.data;

  let q = supabaseAdmin()
    .from("products")
    .select(
      `id, slug, name, is_active, is_featured, is_new, is_bestseller,
       base_price_ngn, base_price_usd, created_at, updated_at, deleted_at,
       brand:brands(id, name),
       category:categories(id, name)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!includeDeleted) q = q.is("deleted_at", null);
  if (status === "active") q = q.eq("is_active", true);
  if (status === "draft") q = q.eq("is_active", false);
  if (brand_id) q = q.eq("brand_id", brand_id);
  if (category_id) q = q.eq("category_id", category_id);
  if (query) {
    const safe = query.replace(/[%_]/g, "\\$&");
    q = q.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }
  if (cursor) q = q.lt("id", cursor);

  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, hyphen-separated")
    .optional()
    .or(z.literal("")),
  brand_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  short_description: z.string().max(400).optional().nullable(),
  base_price_ngn: z.number().nonnegative(),
  base_price_usd: z.number().nonnegative(),
  compare_at_price_ngn: z.number().nonnegative().optional().nullable(),
  compare_at_price_usd: z.number().nonnegative().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  const { data: existing } = await supabaseAdmin()
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) throw new ConflictError("Slug already in use");

  const { data: product, error } = await supabaseAdmin()
    .from("products")
    .insert({
      name: data.name,
      slug,
      brand_id: data.brand_id ?? null,
      category_id: data.category_id ?? null,
      description: data.description ?? null,
      short_description: data.short_description ?? null,
      base_price_ngn: data.base_price_ngn,
      base_price_usd: data.base_price_usd,
      compare_at_price_ngn: data.compare_at_price_ngn ?? null,
      compare_at_price_usd: data.compare_at_price_usd ?? null,
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_new: data.is_new,
      is_bestseller: data.is_bestseller,
    })
    .select(
      `id, slug, name, is_active, is_featured, is_new, is_bestseller,
       base_price_ngn, base_price_usd, brand_id, category_id, description,
       brand:brands(id, name), category:categories(id, name)`,
    )
    .single();
  if (error || !product) throw new Error(error?.message ?? "Insert failed");

  await writeAudit(admin, {
    action: "CREATE_PRODUCT",
    entityType: "product",
    entityId: product.id,
    metadata: { slug },
  });
  try {
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
  } catch {
    // Non-fatal: search index will catch up on next sync.
  }
  await cacheInvalidate("products:list:");
  await cacheInvalidate("product:slug:");
  revalidatePath("/admin/products");
  return created(product);
});
