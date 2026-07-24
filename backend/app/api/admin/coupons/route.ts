/**
 * GET   /api/admin/coupons
 * POST  /api/admin/coupons
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, is_active, starts_at, expires_at, usage_limit, times_used, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const numStr = z.union([z.number().nonnegative(), z.null()]).optional();

const createSchema = z.object({
  code: z.string().min(1).max(40).transform((s) => s.toUpperCase().trim()),
  description: z.string().max(500).optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().nonnegative(),
  min_subtotal_ngn: z.number().nonnegative().default(0),
  min_subtotal_usd: z.number().nonnegative().default(0),
  min_subtotal_eur: z.number().nonnegative().default(0),
  min_subtotal_gbp: z.number().nonnegative().default(0),
  min_subtotal_ghs: z.number().nonnegative().default(0),
  min_subtotal_zar: z.number().nonnegative().default(0),
  min_subtotal_kes: z.number().nonnegative().default(0),
  max_discount_ngn: numStr,
  max_discount_usd: numStr,
  max_discount_eur: numStr,
  max_discount_gbp: numStr,
  max_discount_ghs: numStr,
  max_discount_zar: numStr,
  max_discount_kes: numStr,
  applies_to: z.enum(["all", "category", "product", "collection"]).default("all"),
  applies_to_ids: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  usage_limit: z.number().int().nonnegative().optional().nullable(),
  usage_limit_per_customer: z.number().int().nonnegative().optional().nullable(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { data: existing } = await supabaseAdmin()
    .from("coupons")
    .select("id")
    .eq("code", parsed.data.code)
    .maybeSingle();
  if (existing) throw new ConflictError("Code already in use");

  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .insert({
      ...parsed.data,
      applies_to_ids: JSON.stringify(parsed.data.applies_to_ids ?? []),
      starts_at: parsed.data.starts_at ?? null,
      expires_at: parsed.data.expires_at ?? null,
      usage_limit: parsed.data.usage_limit ?? null,
      usage_limit_per_customer: parsed.data.usage_limit_per_customer ?? null,
    })
    .select("id, code")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_COUPON", entityType: "coupon", entityId: data.id, metadata: { code: data.code } });
  revalidatePath("/admin/coupons");
  return created(data);
});
