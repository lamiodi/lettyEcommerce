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

  const products = (collection.collection_products ?? [])
    .map(
      (cp: {
        position: number;
        products: {
          id: string;
          slug: string;
          name: string;
          base_price_ngn: number;
          base_price_usd: number;
          is_new: boolean;
          is_bestseller: boolean;
          is_featured: boolean;
          product_media: Array<{ url: string; position: number; is_primary: boolean }>;
        } | null;
      }) => {
        if (!cp.products) return null;
        const media = [...(cp.products.product_media ?? [])].sort(
          (a, b) => a.position - b.position,
        );
        return {
          ...cp.products,
          primary_image: media.find((m) => m.is_primary)?.url ?? media[0]?.url,
          position: cp.position,
        };
      },
    )
    .filter((x: unknown) => x !== null)
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

  const result = { ...collection, products };
  await cacheSet(cacheKey, result, 60);
  return ok(result);
});
