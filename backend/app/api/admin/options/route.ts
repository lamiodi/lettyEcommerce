/**
 * GET /api/admin/options — small reference data endpoint for the
 * product form. Returns the active brands and categories, sorted by
 * name. Tiny, cache-friendly, safe to call on every product edit.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = asyncHandler(async (_req: NextRequest) => {
  await checkPermission("read");

  const [brands, categories] = await Promise.all([
    supabaseAdmin()
      .from("brands")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin()
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (brands.error) throw new Error(brands.error.message);
  if (categories.error) throw new Error(categories.error.message);

  return ok({
    brands: brands.data ?? [],
    categories: categories.data ?? [],
  });
});
