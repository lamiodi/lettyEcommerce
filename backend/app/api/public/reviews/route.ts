/**
 * GET /api/public/reviews?product_id=...
 * Public read of approved reviews for a product.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  if (!productId) {
    return Response.json({ error: "product_id is required" }, { status: 400 });
  }
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select("id, rating, title, body, verified_purchase, created_at, customers(first_name, last_name)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});
