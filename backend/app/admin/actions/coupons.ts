"use server";

/**
 * Admin coupon actions.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { cacheInvalidate } from "@/lib/cache/redis";
import { safeAction, type ActionResult } from "@/lib/handler";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

const couponSchema = z.object({
  code: z.string().min(2).max(64),
  description: z.string().max(400).optional().nullable(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive(),
  min_subtotal_ngn: z.number().nonnegative().default(0),
  min_subtotal_usd: z.number().nonnegative().default(0),
  max_discount_ngn: z.number().nonnegative().optional().nullable(),
  max_discount_usd: z.number().nonnegative().optional().nullable(),
  is_active: z.boolean().default(true),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  usage_limit_per_customer: z.number().int().positive().optional().nullable(),
  applies_to: z.enum(["all", "category", "product", "collection"]).default("all"),
  applies_to_ids: z.array(z.string().uuid()).default([]),
});

export async function createCouponAction(raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("manage_coupons");
    const parsed = couponSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("coupons")
      .insert({ ...parsed.data, applies_to_ids: parsed.data.applies_to_ids })
      .select("id, code")
      .single();
    if (error || !data) {
      if (error?.code === "23505") throw new ConflictError("Coupon code already exists");
      throw new Error(error?.message ?? "Insert failed");
    }
    await audit(admin, "CREATE_COUPON", "coupon", data.id, { code: data.code });
    revalidatePath("/admin/coupons");
    return { id: data.id };
  });
}

export async function updateCouponAction(id: string, raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("manage_coupons");
    const parsed = couponSchema.partial().safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("coupons")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, code")
      .single();
    if (error || !data) throw new NotFoundError("Coupon not found");
    await audit(admin, "UPDATE_COUPON", "coupon", data.id);
    revalidatePath("/admin/coupons");
    return { id: data.id };
  });
}

export async function disableCouponAction(id: string) {
  return safeAction(async () => {
    const admin = await checkPermission("manage_coupons");
    const { data, error } = await supabaseAdmin()
      .from("coupons")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data) throw new NotFoundError("Coupon not found");
    await audit(admin, "DISABLE_COUPON", "coupon", data.id);
    revalidatePath("/admin/coupons");
    return { id: data.id };
  });
}
