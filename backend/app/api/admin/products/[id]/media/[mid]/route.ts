/**
 * PATCH  /api/admin/products/:id/media/:mid — update alt / position / is_primary
 * DELETE /api/admin/products/:id/media/:mid — remove media
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { partialUpdateProduct } from "@/lib/algolia";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string; mid: string }> };

const updateSchema = z.object({
  alt_text: z.string().max(200).nullable().optional(),
  position: z.number().int().optional(),
  is_primary: z.boolean().optional(),
  type: z.enum(["image", "video"]).optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id, mid } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // If setting primary, unset other primaries first.
  if (parsed.data.is_primary) {
    await supabaseAdmin()
      .from("product_media")
      .update({ is_primary: false })
      .eq("product_id", id)
      .neq("id", mid);
  }

  const { data, error } = await supabaseAdmin()
    .from("product_media")
    .update(parsed.data)
    .eq("id", mid)
    .eq("product_id", id)
    .select("id, url, is_primary")
    .single();
  if (error || !data) throw new NotFoundError("Media not found");

  await writeAudit(admin, {
    action: "UPDATE_PRODUCT_MEDIA",
    entityType: "product_media",
    entityId: data.id,
    metadata: parsed.data,
  });
  if (data.is_primary) {
    try {
      await partialUpdateProduct(id, { primary_image: data.url });
    } catch {
      // Non-fatal.
    }
  }
  revalidatePath("/admin/products");
  return ok({ id: data.id });
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id, mid } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("product_media")
    .delete()
    .eq("id", mid)
    .eq("product_id", id)
    .select("id, product_id, is_primary, url")
    .single();
  if (error || !data) throw new NotFoundError("Media not found");

  await writeAudit(admin, { action: "REMOVE_PRODUCT_MEDIA", entityType: "product_media", entityId: data.id });
  if (data.is_primary) {
    try {
      await partialUpdateProduct(data.product_id, { primary_image: null });
    } catch {
      // Non-fatal.
    }
  }
  revalidatePath("/admin/products");
  return ok({ id: data.id });
});
