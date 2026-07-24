/**
 * GET   /api/admin/shipping/zones
 * POST  /api/admin/shipping/zones
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("shipping_zones")
    .select("id, name, countries, is_active, created_at, updated_at, shipping_methods (id, name, is_active)")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  countries: z.array(z.string().length(2)).min(1).max(80),
  is_active: z.boolean().default(true),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("shipping_zones")
    .insert({ ...parsed.data, countries: JSON.stringify(parsed.data.countries) })
    .select("id, name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_SHIPPING_ZONE", entityType: "shipping_zone", entityId: data.id, metadata: parsed.data });
  await cacheInvalidate("shipping:zones:");
  revalidatePath("/admin/shipping");
  return created(data);
});
