/**
 * GET   /api/admin/banners
 * POST  /api/admin/banners
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("banners")
    .select("id, title, subtitle, image_url, link_url, is_active, position, starts_at, ends_at")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(300).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  link_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  position: z.number().int().default(0),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("banners")
    .insert({
      ...parsed.data,
      starts_at: parsed.data.starts_at ?? null,
      ends_at: parsed.data.ends_at ?? null,
    })
    .select("id, title")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_BANNER", entityType: "banner", entityId: data.id });
  revalidatePath("/admin/banners");
  return created(data);
});
