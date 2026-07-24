/**
 * GET   /api/admin/brands
 * POST  /api/admin/brands
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils/slug";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("brands")
    .select("id, name, slug, is_active, created_at")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const slug = parsed.data.slug && parsed.data.slug.length > 0 ? parsed.data.slug : slugify(parsed.data.name);
  const { data, error } = await supabaseAdmin()
    .from("brands")
    .insert({ name: parsed.data.name, slug, is_active: parsed.data.is_active })
    .select("id, name, slug")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_BRAND", entityType: "brand", entityId: data.id });
  revalidatePath("/admin/catalog");
  return created(data);
});
