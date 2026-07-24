"use server";

/**
 * Admin inventory actions.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { restockVariant } from "@/lib/inventory/manager";
import { partialUpdateProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { safeAction, type ActionResult } from "@/lib/handler";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

const restockSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export async function restockVariantAction(raw: unknown): Promise<ActionResult<{ id: string; new_stock: number }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_inventory");
    const parsed = restockSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { variant_id, quantity, notes } = parsed.data;

    await restockVariant({ variantId: variant_id, quantity, adminId: admin.sub, notes });

    const { data: variant, error } = await supabaseAdmin()
      .from("product_variants")
      .select("id, stock_quantity, product_id")
      .eq("id", variant_id)
      .single();
    if (error || !variant) throw new NotFoundError("Variant not found");

    await audit(admin, "RESTOCK_VARIANT", "product_variant", variant_id, { quantity, notes });
    await partialUpdateProduct(variant.product_id, {
      in_stock: variant.stock_quantity > 0,
      total_stock: variant.stock_quantity,
    });
    await cacheInvalidate("product:slug:");
    revalidatePath("/admin/inventory");
    return { id: variant_id, new_stock: variant.stock_quantity };
  });
}

const adjustSchema = z.object({
  variant_id: z.string().uuid(),
  new_quantity: z.number().int().nonnegative(),
  reason: z.string().min(1).max(500),
});

export async function adjustInventoryAction(raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("update_inventory");
    const parsed = adjustSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { variant_id, new_quantity, reason } = parsed.data;

    const { data: variant, error } = await supabaseAdmin()
      .from("product_variants")
      .select("id, stock_quantity, product_id")
      .eq("id", variant_id)
      .single();
    if (error || !variant) throw new NotFoundError("Variant not found");
    const delta = new_quantity - variant.stock_quantity;

    const { error: updErr } = await supabaseAdmin()
      .from("product_variants")
      .update({ stock_quantity: new_quantity, updated_at: new Date().toISOString() })
      .eq("id", variant_id);
    if (updErr) throw new Error(updErr.message);

    await supabaseAdmin().from("inventory_transactions").insert({
      variant_id,
      change_quantity: delta,
      reason: "ADJUSTMENT",
      notes: reason,
      created_by: admin.sub,
    });
    await audit(admin, "ADJUST_INVENTORY", "product_variant", variant_id, { delta, new_quantity, reason });
    await partialUpdateProduct(variant.product_id, {
      in_stock: new_quantity > 0,
      total_stock: new_quantity,
    });
    revalidatePath("/admin/inventory");
    return { id: variant_id, new_quantity };
  });
}
