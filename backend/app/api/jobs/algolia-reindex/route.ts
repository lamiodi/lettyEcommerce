/**
 * POST /api/jobs/algolia-reindex
 * Full reindex of all active products into Algolia. Heavy — use sparingly.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ensureIndexes, upsertProducts, type ProductRecord } from "@/lib/algolia";
import { logger } from "@/lib/logger";

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("upstash-signature");
  const raw = await req.text();
  const isSigned = await verifyQStashSignature(signature, raw);
  if (!isSigned && process.env.NODE_ENV === "production") {
    return new Response("Invalid signature", { status: 401 });
  }

  await ensureIndexes();

  const PAGE = 500;
  let from = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .select(
        "id, slug, name, description, base_price_ngn, base_price_usd, is_active, is_featured, is_new, is_bestseller, created_at, updated_at, brand_id, category_id, product_media(url, is_primary, position)",
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(from, from + PAGE - 1);
    if (error) {
      logger.error({ error }, "algolia-reindex: query failed");
      break;
    }
    if (!data || data.length === 0) break;

    const records: ProductRecord[] = data.map((p) => {
      const media = (p.product_media ?? []).sort(
        (a: { position: number }, b: { position: number }) => a.position - b.position,
      );
      const primary = media.find((m: { is_primary: boolean }) => m.is_primary)?.url ?? media[0]?.url;
      return {
        objectID: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        brand_id: p.brand_id,
        brand_name: null,
        category_id: p.category_id,
        category_name: null,
        base_price_ngn: Number(p.base_price_ngn),
        base_price_usd: Number(p.base_price_usd),
        primary_image: primary ?? null,
        in_stock: true,
        total_stock: 0,
        is_active: p.is_active,
        is_featured: p.is_featured,
        is_new: p.is_new,
        is_bestseller: p.is_bestseller,
        created_at: Math.floor(new Date(p.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(p.updated_at).getTime() / 1000),
      };
    });
    await upsertProducts(records);
    total += records.length;
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return Response.json({ ok: true, total });
});
