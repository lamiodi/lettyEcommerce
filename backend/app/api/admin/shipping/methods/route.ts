/**
 * GET   /api/admin/shipping/methods
 * POST  /api/admin/shipping/methods
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("shipping_methods")
    .select(
      `id, zone_id, name, description, is_active,
       rate_ngn, rate_usd, rate_eur, rate_gbp, rate_ghs, rate_zar, rate_kes,
       free_over_ngn, free_over_usd, free_over_eur, free_over_gbp, free_over_ghs, free_over_zar, free_over_kes,
       zone:shipping_zones (id, name)`,
    )
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const numStr = z.union([z.number().nonnegative(), z.null()]).optional();

const createSchema = z.object({
  zone_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
  rate_ngn: z.number().nonnegative().default(0),
  rate_usd: z.number().nonnegative().default(0),
  rate_eur: z.number().nonnegative().default(0),
  rate_gbp: z.number().nonnegative().default(0),
  rate_ghs: z.number().nonnegative().default(0),
  rate_zar: z.number().nonnegative().default(0),
  rate_kes: z.number().nonnegative().default(0),
  free_over_ngn: numStr,
  free_over_usd: numStr,
  free_over_eur: numStr,
  free_over_gbp: numStr,
  free_over_ghs: numStr,
  free_over_zar: numStr,
  free_over_kes: numStr,
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { data: zone } = await supabaseAdmin()
    .from("shipping_zones")
    .select("id")
    .eq("id", parsed.data.zone_id)
    .maybeSingle();
  if (!zone) throw new NotFoundError("Zone not found");

  const { data, error } = await supabaseAdmin()
    .from("shipping_methods")
    .insert(parsed.data)
    .select("id, name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_SHIPPING_METHOD", entityType: "shipping_method", entityId: data.id, metadata: parsed.data });
  await cacheInvalidate("shipping:methods:");
  revalidatePath("/admin/shipping");
  return created(data);
});
