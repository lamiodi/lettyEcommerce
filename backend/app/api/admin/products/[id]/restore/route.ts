/**
 * POST /api/admin/products/:id/restore — clear `deleted_at` and re-activate.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { partialUpdateProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

export const POST = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("products")
    .update({ deleted_at: null, is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, slug")
    .single();
  if (error || !data) throw new NotFoundError("Product not found");
  await writeAudit(admin, { action: "RESTORE_PRODUCT", entityType: "product", entityId: data.id });
  try {
    await partialUpdateProduct(data.id, { is_active: true });
  } catch {
    // Non-fatal.
  }
  await cacheInvalidate(`product:slug:${data.slug}`);
  revalidatePath("/admin/products");
  return ok({ id: data.id });
});
