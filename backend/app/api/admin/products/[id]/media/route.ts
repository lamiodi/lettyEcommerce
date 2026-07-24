/**
 * GET   /api/admin/products/:id/media — list media
 * POST  /api/admin/products/:id/media — add a media entry (URL was already uploaded)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { partialUpdateProduct } from "@/lib/algolia";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  await checkPermission("read");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("product_media")
    .select("id, url, alt_text, position, is_primary, type, created_at")
    .eq("product_id", id)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().max(200).optional().nullable(),
  position: z.number().int().default(0),
  is_primary: z.boolean().default(false),
  type: z.enum(["image", "video"]).default("image"),
});

export const POST = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("create");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: product } = await supabaseAdmin()
    .from("products")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) throw new NotFoundError("Product not found");

  const { data, error } = await supabaseAdmin()
    .from("product_media")
    .insert({ ...parsed.data, product_id: id })
    .select("id, url, is_primary")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");

  // Promote primary.
  if (data.is_primary) {
    await supabaseAdmin()
      .from("product_media")
      .update({ is_primary: false })
      .eq("product_id", id)
      .neq("id", data.id);
  }

  await writeAudit(admin, { action: "ADD_PRODUCT_MEDIA", entityType: "product_media", entityId: data.id });
  if (data.is_primary) {
    try {
      await partialUpdateProduct(id, { primary_image: data.url });
    } catch {
      // Non-fatal.
    }
  }
  revalidatePath("/admin/products");
  return created({ id: data.id });
});
