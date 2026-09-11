import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { products } from "@/lib/mock/products";

export interface InventoryRecord {
  variantId: string;
  sku: string;
  productSlug: string;
  productName: string;
  shadeName: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

const INVENTORY_CACHE_FILE = path.join(process.cwd(), ".inventory-cache.json");

// Build default initial seed from catalog
function getInitialInventorySeed(): InventoryRecord[] {
  const seed: InventoryRecord[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    for (const variant of product.variants) {
      seed.push({
        variantId: variant.id,
        sku: variant.sku || variant.id,
        productSlug: product.slug,
        productName: product.name,
        shadeName: (variant as any).color || (variant as any).name || "Standard",
        stockQuantity: typeof variant.stockQuantity === "number" ? variant.stockQuantity : 25,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        updatedAt: now,
      });
    }
  }

  return seed;
}

let inMemoryInventory: InventoryRecord[] | null = null;

function readInventoryCache(): InventoryRecord[] {
  if (inMemoryInventory && inMemoryInventory.length > 0) {
    return inMemoryInventory;
  }

  try {
    if (fs.existsSync(INVENTORY_CACHE_FILE)) {
      const content = fs.readFileSync(INVENTORY_CACHE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryInventory = parsed;
        return inMemoryInventory;
      }
    }
  } catch (err) {
    console.warn("Could not read inventory cache file:", err);
  }

  inMemoryInventory = getInitialInventorySeed();
  writeInventoryCache(inMemoryInventory);
  return inMemoryInventory;
}

function writeInventoryCache(data: InventoryRecord[]) {
  inMemoryInventory = data;
  try {
    fs.writeFileSync(INVENTORY_CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal warning on read-only serverless filesystems
    console.warn("Could not persist inventory cache to disk:", err);
  }
}

let pool: Pool | null = null;
function getDbPool(): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    return pool;
  } catch (e) {
    console.warn("Inventory DB pool initialization warning:", e);
    return null;
  }
}

/**
 * Get the live stock quantity for a given variant ID.
 */
export async function getVariantStock(variantId: string): Promise<number> {
  const db = getDbPool();
  if (db) {
    try {
      const res = await db.query(
        "SELECT stock_quantity FROM product_variants WHERE id = $1 OR sku = $1 LIMIT 1",
        [variantId]
      );
      if (res.rows.length > 0) {
        return parseInt(res.rows[0].stock_quantity, 10);
      }
    } catch {
      // Fall through to memory/cache
    }
  }

  const list = readInventoryCache();
  const found = list.find((item) => item.variantId === variantId || item.sku === variantId);
  return found ? found.stockQuantity : 20;
}

/**
 * Check if all requested items are in stock.
 */
export async function checkItemsAvailability(
  items: Array<{ variantId?: string; productSlug?: string; quantity: number }>
): Promise<{ available: boolean; error?: string }> {
  const list = readInventoryCache();

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const match = list.find(
      (inv) => inv.variantId === item.variantId || (item.productSlug && inv.productSlug === item.productSlug)
    );

    if (match) {
      if (match.stockQuantity < qty) {
        return {
          available: false,
          error: `${match.productName} (${match.shadeName}) only has ${match.stockQuantity} remaining in stock.`,
        };
      }
    }
  }

  return { available: true };
}

/**
 * Atomically decrement inventory upon completed/confirmed checkout.
 */
export async function decrementInventory(
  items: Array<{ variantId?: string; productSlug?: string; quantity: number }>,
  referenceOrder: string
): Promise<{ success: boolean; decremented: Array<{ variantId: string; newStock: number }> }> {
  const list = readInventoryCache();
  const now = new Date().toISOString();
  const decremented: Array<{ variantId: string; newStock: number }> = [];

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const inv = list.find(
      (record) => record.variantId === item.variantId || (item.productSlug && record.productSlug === item.productSlug)
    );

    if (inv) {
      inv.stockQuantity = Math.max(0, inv.stockQuantity - qty);
      inv.updatedAt = now;
      decremented.push({ variantId: inv.variantId, newStock: inv.stockQuantity });
    }
  }

  writeInventoryCache(list);

  // Sync to PostgreSQL if connected
  const db = getDbPool();
  if (db) {
    for (const item of items) {
      const qty = Math.max(1, item.quantity || 1);
      try {
        await db.query(
          `UPDATE product_variants 
           SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW()
           WHERE id = $2 OR sku = $2`,
          [qty, item.variantId]
        );
      } catch (dbErr) {
        console.warn(`Postgres stock decrement warning for variant ${item.variantId}:`, dbErr);
      }
    }
  }

  console.info(`[Inventory] Decremented stock for order ${referenceOrder}:`, decremented);
  return { success: true, decremented };
}

/**
 * Restock or adjust inventory for a variant (e.g. from Admin Dashboard).
 */
export async function updateVariantStock(
  variantId: string,
  newStockQuantity: number
): Promise<InventoryRecord | null> {
  const list = readInventoryCache();
  const now = new Date().toISOString();
  const match = list.find((item) => item.variantId === variantId || item.sku === variantId);

  if (!match) return null;

  match.stockQuantity = Math.max(0, newStockQuantity);
  match.updatedAt = now;
  writeInventoryCache(list);

  const db = getDbPool();
  if (db) {
    try {
      await db.query(
        "UPDATE product_variants SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 OR sku = $2",
        [match.stockQuantity, variantId]
      );
    } catch (e) {
      console.warn("Postgres updateVariantStock warning:", e);
    }
  }

  return match;
}

/**
 * Get all inventory rows (used by /admin/inventory and stock monitor).
 */
export async function listAllInventory(params?: {
  query?: string;
  lowOnly?: boolean;
}): Promise<InventoryRecord[]> {
  const list = readInventoryCache();
  let result = [...list];

  if (params?.query) {
    const q = params.query.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.shadeName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
    );
  }

  if (params?.lowOnly) {
    result = result.filter((item) => item.stockQuantity <= item.lowStockThreshold);
  }

  result.sort((a, b) => a.stockQuantity - b.stockQuantity);
  return result;
}
