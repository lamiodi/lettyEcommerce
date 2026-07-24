/**
 * POST /api/jobs/inventory-sync
 * Reconciles Postgres stock → Algolia. Intended to run hourly.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { supabaseAdmin } from "@/lib/supabase/server";
import { partialUpdateProduct } from "@/lib/algolia";
import { logger } from "@/lib/logger";

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("upstash-signature");
  const raw = await req.text();
  const isSigned = await verifyQStashSignature(signature, raw);
  if (!isSigned && process.env.NODE_ENV === "production") {
    return new Response("Invalid signature", { status: 401 });
  }

  // Only sync products whose stock has changed in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: variants, error } = await supabaseAdmin()
    .from("product_variants")
    .select("id, product_id, stock_quantity, updated_at")
    .gte("updated_at", oneHourAgo)
    .limit(1000);
  if (error) {
    logger.error({ error }, "inventory-sync: load variants failed");
    return Response.json({ ok: false }, { status: 500 });
  }

  // Group by product and use min stock as a coarse "in_stock" signal
  const byProduct = new Map<string, number>();
  for (const v of variants ?? []) {
    const prev = byProduct.get(v.product_id) ?? Infinity;
    byProduct.set(v.product_id, Math.min(prev, v.stock_quantity));
  }

  for (const [productId, stock] of byProduct) {
    await partialUpdateProduct(productId, { in_stock: stock > 0, total_stock: stock });
  }

  return Response.json({ ok: true, synced: byProduct.size });
});
