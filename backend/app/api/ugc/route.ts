/**
 * GET /api/ugc — Public endpoint to fetch active UGC videos for storefront.
 */
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";

const UGC_SETTINGS_KEY = "ugc_videos";

export const revalidate = 60;

export const GET = asyncHandler(async () => {
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", UGC_SETTINGS_KEY)
    .single();

  if (error && error.code !== "PGRST116") {
    return ok([]);
  }

  const list = (data?.value as any[]) ?? [];
  const activeOnly = list.filter((item: any) => item && item.isActive !== false);
  return ok(activeOnly);
});
