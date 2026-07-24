import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export const GET = asyncHandler(async (_req: NextRequest) => {
  const cacheKey = "categories:list";
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return ok(cached);

  const { data, error } = await supabaseAdmin()
    .from("categories")
    .select("id, slug, name, description, image_url, position, is_active, parent_id")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  await cacheSet(cacheKey, data ?? [], 300);
  return ok(data ?? []);
});
