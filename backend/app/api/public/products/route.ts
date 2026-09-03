/**
 * GET /api/public/products
 *
 * Public, paginated product listing with filtering, sorting, and free-text search.
 * Uses the products index via the browser-facing Algolia client when `q` is
 * present; otherwise reads directly from Postgres.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok, paginated } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { productListSchema } from "@/lib/validations";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { publicAlgolia } from "@/lib/algolia";
import { corsHeaders } from "@/lib/cors";
import { NotFoundError } from "@/lib/errors";

const querySchema = productListSchema;

export const GET = asyncHandler(async (req: NextRequest) => {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { cursor, limit, category, brand, collection, sort, minPrice, maxPrice, inStock } = parsed.data;
  const url = new URL(req.url);
  // M2: bound the free-text query to 256 chars; longer strings are truncated
  // to avoid expensive Algolia / ILIKE scans.
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 256) || undefined;

  const cacheKey = `products:list:${JSON.stringify({ cursor, limit, category, brand, collection, sort, minPrice, maxPrice, inStock, q })}`;
  const cached = await cacheGet<{ data: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return paginated(cached.data, cached.total, cursor ? Number(cursor) || 1 : 1, limit);
  }

  // Free-text search via Algolia if a query string is present
  if (q && q.trim().length > 0) {
    try {
      const indexName = process.env.ALGOLIA_PRODUCTS_INDEX || "letty_products";
      const index = publicAlgolia().initIndex(indexName);
      const res = await index.search<ProductSearchHit>(q, {
        hitsPerPage: limit,
        // M1: Algolia uses 0-indexed pages. We accept cursor as 1-indexed
        // and convert here.
        page: Math.max(0, (Number(cursor) || 1) - 1),
        filters: buildAlgoliaFilters({ category, brand, collection, minPrice, maxPrice, inStock }),
      });
      return paginated(
        res.hits.map(toProductCard),
        res.nbHits,
        res.page + 1,
        limit,
      );
    } catch {
      // Fall through to Postgres on Algolia error
    }
  }

  let query = supabaseAdmin()
    .from("products")
    .select(
      "id, slug, name, base_price_ngn, base_price_usd, is_new, is_bestseller, is_featured, created_at, brand_id, category_id, product_media(url, position, is_primary)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .is("deleted_at", null);

  if (category) query = query.eq("category_id", category);
  if (brand) query = query.eq("brand_id", brand);
  if (minPrice != null) query = query.gte("base_price_usd", minPrice);
  if (maxPrice != null) query = query.lte("base_price_usd", maxPrice);

  if (collection) {
    const { data: cp } = await supabaseAdmin()
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collection);
    const ids = (cp ?? []).map((r) => r.product_id);
    if (ids.length === 0) {
      return paginated([], 0, 1, limit);
    }
    query = query.in("id", ids);
  }

  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_asc":
      query = query.order("base_price_usd", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price_usd", { ascending: false });
      break;
    case "rating":
    case "featured":
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("is_bestseller", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  // M1: cursor is 1-indexed; convert to 0-indexed offset for the range() call.
  // Cap the page number to prevent unbounded scans even with a valid cursor.
  const page = Math.max(1, Math.min(1000, Number(cursor) || 1));
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError("No products");

  const cards = data.map(toProductCard);
  await cacheSet(cacheKey, { data: cards, total: count ?? cards.length }, 60);
  return paginated(cards, count ?? cards.length, page, limit);
});

function buildAlgoliaFilters(f: {
  category?: string;
  brand?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): string {
  const parts: string[] = ["is_active:true"];
  if (f.category) parts.push(`category_id:"${f.category}"`);
  if (f.brand) parts.push(`brand_id:"${f.brand}"`);
  if (f.minPrice != null) parts.push(`base_price_usd >= ${f.minPrice}`);
  if (f.maxPrice != null) parts.push(`base_price_usd <= ${f.maxPrice}`);
  if (f.inStock) parts.push("in_stock:true");
  return parts.join(" AND ");
}

interface ProductSearchHit {
  objectID: string;
  slug: string;
  name: string;
  base_price_usd: number;
  base_price_ngn: number;
  primary_image?: string;
  brand_name?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
}

function toProductCard(p: {
  id?: string;
  objectID?: string;
  slug: string;
  name: string;
  base_price_usd: number;
  base_price_ngn: number;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_featured?: boolean;
  created_at?: string | number;
  product_media?: Array<{ url: string; position: number; is_primary: boolean }>;
  primary_image?: string;
}) {
  let primary: string | undefined;
  if (p.primary_image) primary = p.primary_image;
  if (!primary && p.product_media) {
    const sorted = [...p.product_media].sort((a, b) => a.position - b.position);
    primary = sorted.find((m) => m.is_primary)?.url ?? sorted[0]?.url;
  }
  return {
    id: p.id ?? p.objectID,
    slug: p.slug,
    name: p.name,
    price_usd: p.base_price_usd,
    price_ngn: p.base_price_ngn,
    image: primary,
    is_new: Boolean(p.is_new),
    is_bestseller: Boolean(p.is_bestseller),
    is_featured: Boolean(p.is_featured),
  };
}
