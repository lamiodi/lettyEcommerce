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

  interface ProductMediaItem {
    url: string;
    position: number | null;
    is_primary: boolean | null;
  }

  interface RawProduct {
    id: string;
    slug: string;
    name: string;
    base_price_ngn: number | null;
    base_price_usd: number | null;
    is_new: boolean | null;
    is_bestseller: boolean | null;
    is_featured: boolean | null;
    product_media: ProductMediaItem[] | null;
  }

  interface CollectionProductEntry {
    position: number | null;
    products: RawProduct | RawProduct[] | null;
  }

  interface ProcessedCollectionProduct extends RawProduct {
    primary_image?: string;
    position: number;
  }

  const rawProducts = ((collection as unknown as { collection_products?: CollectionProductEntry[] })?.collection_products ?? []);
  const products: ProcessedCollectionProduct[] = rawProducts
    .map((cp) => {
      if (!cp?.products) return null;
      const prod = Array.isArray(cp.products) ? cp.products[0] : cp.products;
      if (!prod) return null;
      const media = [...(prod.product_media ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      );
      return {
        ...prod,
        primary_image: media.find((m) => m.is_primary)?.url ?? media[0]?.url,
        position: cp.position ?? 0,
      };
    })
    .filter((x): x is ProcessedCollectionProduct => Boolean(x))
    .sort((a, b) => a.position - b.position);

  const result = { ...collection, products };
  await cacheSet(cacheKey, result, 60);
  return ok(result);
});
