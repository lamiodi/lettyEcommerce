import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export const GET = asyncHandler(async (_req: NextRequest) => {
  const cacheKey = "brands:list";
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return ok(cached);

  const { data, error } = await supabaseAdmin()
    .from("brands")
    .select("id, slug, name, description, logo_url, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  await cacheSet(cacheKey, data ?? [], 300);
  return ok(data ?? []);
});
