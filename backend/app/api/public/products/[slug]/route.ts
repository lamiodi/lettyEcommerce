/**
 * GET /api/public/products/[slug]
 * Returns full product detail: variants, media, brand, category, reviews.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const cacheKey = `product:slug:${slug}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return ok(cached);

  const { data: product, error } = await supabaseAdmin()
    .from("products")
    .select(
      `
        *,
        brands (id, slug, name, logo_url),
        categories (id, slug, name),
        product_media (id, url, alt_text, position, is_primary, type),
        product_variants (id, sku, barcode, price_override_ngn, price_override_usd,
                          weight_grams, stock_quantity, reserved_quantity,
                          is_active, position,
          variant_options (option_name, option_value)
        ),
        reviews (id, rating, title, body, verified_purchase, created_at, is_approved,
          customers (first_name, last_name)
        )
      `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();
  if (error || !product) throw new NotFoundError("Product not found");

  // Filter to approved reviews only
  const reviews = (product.reviews ?? []).filter((r: { is_approved: boolean }) => r.is_approved);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / reviews.length
      : 0;

  const totalStock = (product.product_variants ?? []).reduce(
    (a: number, v: { stock_quantity: number; is_active: boolean }) =>
      a + (v.is_active ? v.stock_quantity : 0),
    0,
  );

  const result = {
    ...product,
    reviews,
    review_summary: { count: reviews.length, average: Number(avgRating.toFixed(2)) },
    in_stock: totalStock > 0,
    total_stock: totalStock,
  };

  await cacheSet(cacheKey, result, 60);
  return ok(result);
});
