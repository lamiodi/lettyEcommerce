/**
 * Inventory reservation and release — thin wrappers around the SQL RPCs.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { CartItemInput } from "@/lib/validations";

export async function reserveInventory(orderId: string, items: CartItemInput[]) {
  const payload = items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }));
  const { error } = await supabaseAdmin().rpc("reserve_inventory", {
    p_order_id: orderId,
    p_items: payload,
  });
  if (error) {
    logger.warn({ error: error.message, orderId }, "reserve_inventory failed");
    if (/out of stock/i.test(error.message)) {
      throw new ConflictError("One or more items are out of stock");
    }
    throw new Error(`Inventory reservation failed: ${error.message}`);
  }
}

export async function releaseInventory(orderId: string) {
  const { error } = await supabaseAdmin().rpc("release_inventory", { p_order_id: orderId });
  if (error) {
    logger.error({ error: error.message, orderId }, "release_inventory failed");
    throw new Error(`Inventory release failed: ${error.message}`);
  }
}

export async function commitInventory(paymentReference: string) {
  const { error } = await supabaseAdmin().rpc("commit_inventory", { p_reference: paymentReference });
  if (error) {
    logger.error({ error: error.message, paymentReference }, "commit_inventory failed");
    throw new Error(`Inventory commit failed: ${error.message}`);
  }
}

export async function restockVariant(opts: {
  variantId: string;
  quantity: number;
  adminId: string;
  notes?: string;
}) {
  const { error } = await supabaseAdmin().rpc("restock_variant", {
    p_variant_id: opts.variantId,
    p_quantity: opts.quantity,
    p_admin_id: opts.adminId,
    p_notes: opts.notes ?? null,
  });
  if (error) {
    if (/not found/i.test(error.message)) throw new NotFoundError("Variant not found");
    throw new Error(`Restock failed: ${error.message}`);
  }
}
