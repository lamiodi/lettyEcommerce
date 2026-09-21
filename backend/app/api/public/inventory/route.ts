/**
 * GET /api/public/inventory
 *
 * Public variant-level stock levels for the storefront's live inventory
 * overlay. Stock counts are already shown on product pages, so this is not
 * sensitive; it is cached briefly so heavy storefront traffic does not hammer
 * Postgres.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { corsHeaders } from "@/lib/cors";

const CACHE_KEY = "public:inventory:variants";
const CACHE_TTL_SECONDS = 60;

export const GET = asyncHandler(async (req: NextRequest) => {
  const cached = await cacheGet<unknown[]>(CACHE_KEY);
  if (cached) {
    return Response.json(
      { data: cached },
      { headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const { data: rows, error } = await supabaseAdmin()
    .from("product_variants")
    .select(
      `id, sku, stock_quantity, reserved_quantity, low_stock_threshold, updated_at,
       product:products!inner(slug, name, deleted_at)`,
    )
    .eq("is_active", true)
    .is("product.deleted_at", null)
    .limit(2000);

  if (error) {
    return Response.json({ error: "Failed to load inventory" }, { status: 500 });
  }

  const data = (rows ?? []).map((row: Record<string, unknown>) => {
    const product = Array.isArray(row.product) ? row.product[0] : row.product;
    const p = (product ?? {}) as { slug?: string; name?: string };
    return {
      variant_id: String(row.id ?? ""),
      sku: String(row.sku ?? ""),
      product_slug: p.slug ?? null,
      product_name: p.name ?? null,
      stock_quantity: Number(row.stock_quantity ?? 0),
      reserved_quantity: Number(row.reserved_quantity ?? 0),
      low_stock_threshold: Number(row.low_stock_threshold ?? 5),
      updated_at: row.updated_at,
    };
  });

  await cacheSet(CACHE_KEY, data, CACHE_TTL_SECONDS).catch(() => {});

  return Response.json(
    { data },
    { headers: corsHeaders(req.headers.get("origin")) },
  );
});
