import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export const GET = asyncHandler(async (_req: NextRequest) => {
  const cacheKey = "collections:list";
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return ok(cached);

  const { data, error } = await supabaseAdmin()
    .from("collections")
    .select("id, slug, name, description, image_url, position, is_active")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  await cacheSet(cacheKey, data ?? [], 120);
  return ok(data ?? []);
});
