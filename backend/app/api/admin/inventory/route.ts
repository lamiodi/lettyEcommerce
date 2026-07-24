/**
 * GET   /api/admin/inventory?query=&lowOnly=&cursor=&limit=
 * POST  /api/admin/inventory/restock
 * POST  /api/admin/inventory/adjust
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok, paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { restockVariant } from "@/lib/inventory/manager";
import { partialUpdateProduct } from "@/lib/algolia";
import { cacheInvalidate } from "@/lib/cache/redis";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const listQuerySchema = z.object({
  query: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  lowOnly: z.coerce.boolean().default(false),
  product_id: z.string().uuid().optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const { query, cursor, limit, lowOnly, product_id } = parsed.data;

  let q = supabaseAdmin()
    .from("product_variants")
    .select(
      `id, sku, stock_quantity, reserved_quantity, low_stock_threshold, is_active, position, product_id,
       product:products!inner(id, slug, name, is_active, deleted_at),
       variant_options (id, option_name, option_value)`,
      { count: "exact" },
    )
    .eq("products.deleted_at", null)
    .order("stock_quantity", { ascending: true })
    .order("sku", { ascending: true })
    .limit(limit);

  if (product_id) q = q.eq("product_id", product_id);
  if (cursor) q = q.lt("id", cursor);
  if (query) {
    const safe = query.replace(/[%_]/g, "\\$&");
    q = q.or(`sku.ilike.%${safe}%,product.name.ilike.%${safe}%`, {
      foreignTable: "products",
    });
  }

  const { data, count } = await q;
  let rows = (data ?? []) as unknown as InventoryRow[];
  if (lowOnly) {
    rows = rows.filter((r) => r.stock_quantity - r.reserved_quantity <= r.low_stock_threshold);
  }
  return paginated(rows, count ?? 0, 1, limit);
});

interface InventoryRow {
  id: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  position: number;
  product_id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
  } | null;
  variant_options: Array<{ id: string; option_name: string; option_value: string }>;
}

const restockSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("update_inventory");
  const body = await req.json().catch(() => ({}));
  const op = (body?.op ?? "restock") as string;

  if (op === "adjust") {
    const adjustSchema = z.object({
      variant_id: z.string().uuid(),
      new_quantity: z.number().int().nonnegative(),
      reason: z.string().min(1).max(500),
    });
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const { variant_id, new_quantity, reason } = parsed.data;
    const { data: variant, error } = await supabaseAdmin()
      .from("product_variants")
      .select("id, stock_quantity, product_id")
      .eq("id", variant_id)
      .single();
    if (error || !variant) {
      return Response.json({ error: "Variant not found" }, { status: 404 });
    }
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
    await writeAudit(admin, {
      action: "ADJUST_INVENTORY",
      entityType: "product_variant",
      entityId: variant_id,
      metadata: { delta, new_quantity, reason },
    });
    try {
      await partialUpdateProduct(variant.product_id, {
        in_stock: new_quantity > 0,
        total_stock: new_quantity,
      });
    } catch {
      // Non-fatal.
    }
    await cacheInvalidate("product:slug:");
    revalidatePath("/admin/inventory");
    return ok({ id: variant_id, new_quantity });
  }

  // Default: restock
  const parsed = restockSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { variant_id, quantity, notes } = parsed.data;
  await restockVariant({ variantId: variant_id, quantity, adminId: admin.sub, notes });
  const { data: variant, error } = await supabaseAdmin()
    .from("product_variants")
    .select("id, stock_quantity, product_id")
    .eq("id", variant_id)
    .single();
  if (error || !variant) {
    return Response.json({ error: "Variant not found" }, { status: 404 });
  }
  await writeAudit(admin, {
    action: "RESTOCK_VARIANT",
    entityType: "product_variant",
    entityId: variant_id,
    metadata: { quantity, notes },
  });
  try {
    await partialUpdateProduct(variant.product_id, {
      in_stock: variant.stock_quantity > 0,
      total_stock: variant.stock_quantity,
    });
  } catch {
    // Non-fatal.
  }
  await cacheInvalidate("product:slug:");
  revalidatePath("/admin/inventory");
  return ok({ id: variant_id, new_stock: variant.stock_quantity });
});
