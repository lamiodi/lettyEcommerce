/**
 * GET   /api/admin/ugc  — list all UGC videos
 * POST  /api/admin/ugc  — add a new UGC video
 * PATCH /api/admin/ugc  — update a UGC video by ID or replace all
 * DELETE /api/admin/ugc — delete a UGC video by ID
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const UGC_SETTINGS_KEY = "ugc_videos";

const ugcVideoSchema = z.object({
  id: z.string().optional(),
  src: z.string().min(1),
  poster: z.string().optional().nullable(),
  handle: z.string().min(1),
  caption: z.string().min(1),
  location: z.string().optional().nullable(),
  productSlug: z.string().min(1),
  productName: z.string().min(1),
  productShade: z.string().optional().nullable(),
  productPrice: z.string().optional().nullable(),
  productImage: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", UGC_SETTINGS_KEY)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  const list = (data?.value as any[]) ?? [];
  return ok(list);
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = ugcVideoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
  }

  const { data: existingRow } = await supabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", UGC_SETTINGS_KEY)
    .single();

  const currentList = Array.isArray(existingRow?.value) ? existingRow.value : [];
  const newVideo = {
    ...parsed.data,
    id: parsed.data.id || `ugc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updatedList = [newVideo, ...currentList];

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({
      key: UGC_SETTINGS_KEY,
      value: updatedList,
      description: "Curated UGC community video reels with tagged boutique products",
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(error.message);

  await writeAudit(admin, {
    action: "CREATE_UGC_VIDEO",
    entityType: "ugc_video",
    entityId: newVideo.id,
  });

  revalidatePath("/admin/ugc");
  revalidatePath("/departments/makeup-beauty");
  return created(newVideo);
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("update");
  const body = await req.json().catch(() => ({}));
  
  // If array, replace the whole list (e.g. for reordering)
  if (Array.isArray(body)) {
    const { error } = await supabaseAdmin()
      .from("app_settings")
      .upsert({
        key: UGC_SETTINGS_KEY,
        value: body,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/ugc");
    return ok({ ok: true });
  }

  // Otherwise, update a single item by id
  const { id, ...updates } = body;
  if (!id) {
    return Response.json({ error: "Missing video id" }, { status: 400 });
  }

  const { data: existingRow } = await supabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", UGC_SETTINGS_KEY)
    .single();

  const currentList = Array.isArray(existingRow?.value) ? existingRow.value : [];
  const updatedList = currentList.map((item: any) =>
    item.id === id ? { ...item, ...updates } : item,
  );

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({
      key: UGC_SETTINGS_KEY,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(error.message);

  await writeAudit(admin, {
    action: "UPDATE_UGC_VIDEO",
    entityType: "ugc_video",
    entityId: id,
  });

  revalidatePath("/admin/ugc");
  return ok({ ok: true });
});

export const DELETE = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("delete");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing video id parameter" }, { status: 400 });
  }

  const { data: existingRow } = await supabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", UGC_SETTINGS_KEY)
    .single();

  const currentList = Array.isArray(existingRow?.value) ? existingRow.value : [];
  const updatedList = currentList.filter((item: any) => item.id !== id);

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({
      key: UGC_SETTINGS_KEY,
      value: updatedList,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(error.message);

  await writeAudit(admin, {
    action: "DELETE_UGC_VIDEO",
    entityType: "ugc_video",
    entityId: id,
  });

  revalidatePath("/admin/ugc");
  return ok({ ok: true, deleted: id });
});
