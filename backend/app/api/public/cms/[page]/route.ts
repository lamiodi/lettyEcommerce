import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ page: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const { page } = await ctx.params;
  const cacheKey = `cms:page:${page}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return ok(cached);

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("cms_sections")
    .select("id, page_type, section_type, title, subtitle, payload, position, starts_at, ends_at")
    .eq("page_type", page)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError("No CMS sections for this page");
  await cacheSet(cacheKey, data, 60);
  return ok(data);
});
