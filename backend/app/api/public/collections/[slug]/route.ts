import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const cacheKey = `collection:slug:${slug}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return ok(cached);

  const { data: collection, error } = await supabaseAdmin()
    .from("collections")
    .select(
      `
        id, slug, name, description, image_url, position, is_active,
        collection_products (
          position,
          products:product_id (
            id, slug, name, base_price_ngn, base_price_usd,
            is_new, is_bestseller, is_featured,
            product_media (url, position, is_primary)
          )
        )
      `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error || !collection) throw new NotFoundError("Collection not found");

  const rawProducts = ((collection as any)?.collection_products ?? []) as any[];
  const products = rawProducts
    .map((cp: any) => {
      if (!cp?.products) return null;
      const prod = Array.isArray(cp.products) ? cp.products[0] : cp.products;
      if (!prod) return null;
      const media = [...(prod.product_media ?? [])].sort(
        (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
      );
      return {
        ...prod,
        primary_image: media.find((m: any) => m.is_primary)?.url ?? media[0]?.url,
        position: cp.position ?? 0,
      };
    })
    .filter((x: any): x is Record<string, any> => Boolean(x))
    .sort((a: any, b: any) => a.position - b.position);

  const result = { ...collection, products };
  await cacheSet(cacheKey, result, 60);
  return ok(result);
});
