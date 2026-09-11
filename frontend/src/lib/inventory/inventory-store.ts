import "server-only";

import fs from "fs";
import path from "path";
import { Pool, type PoolClient } from "pg";
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

export interface InventoryItemRequest {
  variantId?: string;
  productSlug?: string;
  quantity: number;
}

interface InventoryState {
  records: InventoryRecord[];
  processedOrderIds: string[];
}

interface InventoryDbRow {
  variant_id: string;
  sku: string;
  product_slug: string;
  product_name: string;
  shade_name: string | null;
  stock_quantity: number | string;
  reserved_quantity: number | string;
  low_stock_threshold: number | string;
  updated_at: Date | string;
}

interface ResolvedInventoryItem {
  record: InventoryRecord;
  quantity: number;
}

const INVENTORY_CACHE_FILE = path.join(process.cwd(), ".inventory-cache.json");
const catalogVariants = new Map(
  products.flatMap((product) =>
    product.variants.map((variant) => [
      variant.id,
      { sku: variant.sku, productSlug: product.slug },
    ] as const),
  ),
);

function getInitialInventorySeed(): InventoryRecord[] {
  const now = new Date().toISOString();

  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      variantId: variant.id,
      sku: variant.sku || variant.id,
      productSlug: product.slug,
      productName: product.name,
      shadeName: variant.color || variant.size || "Standard",
      stockQuantity: variant.stockQuantity,
      reservedQuantity: 0,
      lowStockThreshold: 5,
      updatedAt: now,
    })),
  );
}

function isInventoryRecord(value: unknown): value is InventoryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.variantId === "string" &&
    typeof record.sku === "string" &&
    typeof record.productSlug === "string" &&
    typeof record.productName === "string" &&
    typeof record.shadeName === "string" &&
    typeof record.stockQuantity === "number" &&
    typeof record.reservedQuantity === "number" &&
    typeof record.lowStockThreshold === "number" &&
    typeof record.updatedAt === "string"
  );
}

let inMemoryState: InventoryState | null = null;

function readInventoryState(): InventoryState {
  if (inMemoryState) return inMemoryState;

  try {
    if (fs.existsSync(INVENTORY_CACHE_FILE)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(INVENTORY_CACHE_FILE, "utf-8"));

      // Backward compatibility with the original array-only cache format.
      if (Array.isArray(parsed)) {
        const records = parsed.filter(isInventoryRecord);
        if (records.length > 0) {
          inMemoryState = { records, processedOrderIds: [] };
          return inMemoryState;
        }
      }

      if (parsed && typeof parsed === "object") {
        const state = parsed as { records?: unknown; processedOrderIds?: unknown };
        if (Array.isArray(state.records)) {
          const records = state.records.filter(isInventoryRecord);
          if (records.length > 0) {
            inMemoryState = {
              records,
              processedOrderIds: Array.isArray(state.processedOrderIds)
                ? state.processedOrderIds.filter((id): id is string => typeof id === "string")
                : [],
            };
            return inMemoryState;
          }
        }
      }
    }
  } catch {
    // A malformed or unavailable cache is safely replaced by the catalog seed.
  }

  inMemoryState = { records: getInitialInventorySeed(), processedOrderIds: [] };
  writeInventoryState(inMemoryState);
  return inMemoryState;
}

function writeInventoryState(state: InventoryState): void {
  inMemoryState = state;
  try {
    fs.writeFileSync(INVENTORY_CACHE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // In-memory state remains usable on read-only serverless filesystems.
  }
}

let pool: Pool | null = null;

function getDbPool(): Pool | null {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5_000,
  });
  pool.on("error", () => undefined);
  return pool;
}

function toInventoryRecord(row: InventoryDbRow): InventoryRecord {
  return {
    variantId: row.variant_id,
    sku: row.sku,
    productSlug: row.product_slug,
    productName: row.product_name,
    shadeName: row.shade_name || "Standard",
    stockQuantity: Number(row.stock_quantity),
    reservedQuantity: Number(row.reserved_quantity),
    lowStockThreshold: Number(row.low_stock_threshold),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function loadInventoryFromDatabase(): Promise<InventoryRecord[] | null> {
  const db = getDbPool();
  if (!db) return null;

  try {
    const result = await db.query<InventoryDbRow>(
      `SELECT pv.id::text AS variant_id,
              pv.sku,
              p.slug AS product_slug,
              p.name AS product_name,
              COALESCE(
                pv.color,
                (SELECT vo.option_value
                   FROM variant_options vo
                  WHERE vo.variant_id = pv.id
                  ORDER BY vo.created_at ASC
                  LIMIT 1),
                'Standard'
              ) AS shade_name,
              pv.stock_quantity,
              pv.reserved_quantity,
              pv.low_stock_threshold,
              pv.updated_at
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
        WHERE p.deleted_at IS NULL
          AND pv.is_active = TRUE`,
    );
    return result.rows.map(toInventoryRecord);
  } catch {
    return null;
  }
}

function resolveInventoryRecord(
  records: InventoryRecord[],
  item: Pick<InventoryItemRequest, "variantId" | "productSlug">,
): InventoryRecord | null {
  const variantId = item.variantId?.trim();
  const catalogVariant = variantId ? catalogVariants.get(variantId) : undefined;

  if (variantId) {
    const exact = records.find(
      (record) =>
        record.variantId === variantId ||
        record.sku === variantId ||
        (catalogVariant ? record.sku === catalogVariant.sku : false),
    );
    if (exact) return exact;
  }

  if (!variantId && item.productSlug) {
    const productMatches = records.filter((record) => record.productSlug === item.productSlug);
    if (productMatches.length === 1) return productMatches[0];
  }

  return null;
}

function resolveInventoryItems(
  records: InventoryRecord[],
  items: InventoryItemRequest[],
): { items: ResolvedInventoryItem[]; error?: string } {
  const aggregated = new Map<string, ResolvedInventoryItem>();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { items: [], error: "Cart quantities must be positive whole numbers." };
    }

    const record = resolveInventoryRecord(records, item);
    if (!record) {
      return { items: [], error: "One or more items in your bag are no longer available." };
    }

    const existing = aggregated.get(record.variantId);
    if (existing) existing.quantity += item.quantity;
    else aggregated.set(record.variantId, { record, quantity: item.quantity });
  }

  return { items: [...aggregated.values()] };
}

function filterAndSortInventory(
  records: InventoryRecord[],
  params?: { query?: string; lowOnly?: boolean },
): InventoryRecord[] {
  let result = [...records];

  if (params?.query) {
    const query = params.query.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.productName.toLowerCase().includes(query) ||
        item.shadeName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query),
    );
  }

  if (params?.lowOnly) {
    result = result.filter(
      (item) => item.stockQuantity - item.reservedQuantity <= item.lowStockThreshold,
    );
  }

  return result.sort(
    (a, b) =>
      a.stockQuantity - a.reservedQuantity - (b.stockQuantity - b.reservedQuantity) ||
      a.sku.localeCompare(b.sku),
  );
}

function syncLocalInventory(
  changes: Array<{ variantId: string; sku: string; newStock: number }>,
  processedOrderId?: string,
): void {
  const state = readInventoryState();
  const now = new Date().toISOString();

  for (const change of changes) {
    const record = state.records.find(
      (candidate) =>
        candidate.variantId === change.variantId || candidate.sku === change.sku,
    );
    if (record) {
      record.stockQuantity = change.newStock;
      record.updatedAt = now;
    }
  }

  if (processedOrderId && !state.processedOrderIds.includes(processedOrderId)) {
    state.processedOrderIds.push(processedOrderId);
  }
  writeInventoryState(state);
}

async function decrementDatabaseInventory(
  client: PoolClient,
  resolvedItems: ResolvedInventoryItem[],
  orderId: string,
): Promise<{ idempotent: boolean; changes: Array<{ variantId: string; sku: string; newStock: number }> }> {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [orderId]);
    const prior = await client.query(
      "SELECT 1 FROM inventory_transactions WHERE reference_id::text = $1 AND reason = 'SALE' LIMIT 1",
      [orderId],
    );
    if (prior.rowCount && prior.rowCount > 0) {
      await client.query("COMMIT");
      return { idempotent: true, changes: [] };
    }

    const changes: Array<{ variantId: string; sku: string; newStock: number }> = [];
    for (const item of resolvedItems) {
      const result = await client.query<{
        id: string;
        sku: string;
        stock_quantity: number | string;
      }>(
        `UPDATE product_variants
            SET stock_quantity = stock_quantity - $1,
                updated_at = NOW()
          WHERE (id::text = $2 OR sku = $3)
            AND stock_quantity - reserved_quantity >= $1
          RETURNING id::text AS id, sku, stock_quantity`,
        [item.quantity, item.record.variantId, item.record.sku],
      );
      const updated = result.rows[0];
      if (!updated) {
        throw new Error(
          `${item.record.productName} (${item.record.shadeName}) no longer has enough stock.`,
        );
      }

      await client.query(
        `INSERT INTO inventory_transactions
           (variant_id, change_quantity, reason, reference_id, notes)
         VALUES ($1, $2, 'SALE', $3, $4)`,
        [updated.id, -item.quantity, orderId, "Stripe checkout confirmation"],
      );
      changes.push({
        variantId: updated.id,
        sku: updated.sku,
        newStock: Number(updated.stock_quantity),
      });
    }

    await client.query("COMMIT");
    return { idempotent: false, changes };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function getVariantStock(variantId: string): Promise<number> {
  const records = (await loadInventoryFromDatabase()) ?? readInventoryState().records;
  return resolveInventoryRecord(records, { variantId })?.stockQuantity ?? 0;
}

export async function checkItemsAvailability(
  items: InventoryItemRequest[],
): Promise<{ available: boolean; error?: string }> {
  if (items.length === 0) {
    return { available: false, error: "Your bag is empty." };
  }

  const records = (await loadInventoryFromDatabase()) ?? readInventoryState().records;
  const resolved = resolveInventoryItems(records, items);
  if (resolved.error) return { available: false, error: resolved.error };

  for (const item of resolved.items) {
    const available = Math.max(0, item.record.stockQuantity - item.record.reservedQuantity);
    if (available < item.quantity) {
      return {
        available: false,
        error: `${item.record.productName} (${item.record.shadeName}) only has ${available} remaining in stock.`,
      };
    }
  }

  return { available: true };
}

export async function decrementInventory(
  items: InventoryItemRequest[],
  orderId: string,
): Promise<{
  success: boolean;
  idempotent: boolean;
  decremented: Array<{ variantId: string; newStock: number }>;
}> {
  const databaseRecords = await loadInventoryFromDatabase();
  const records = databaseRecords ?? readInventoryState().records;
  const resolved = resolveInventoryItems(records, items);
  if (resolved.error) throw new Error(resolved.error);

  const db = databaseRecords ? getDbPool() : null;
  if (db) {
    const client = await db.connect();
    try {
      const result = await decrementDatabaseInventory(client, resolved.items, orderId);
      syncLocalInventory(result.changes, orderId);
      return {
        success: true,
        idempotent: result.idempotent,
        decremented: result.changes.map((change) => ({
          variantId: change.variantId,
          newStock: change.newStock,
        })),
      };
    } finally {
      client.release();
    }
  }

  const state = readInventoryState();
  if (state.processedOrderIds.includes(orderId)) {
    return { success: true, idempotent: true, decremented: [] };
  }

  for (const item of resolved.items) {
    const available = Math.max(0, item.record.stockQuantity - item.record.reservedQuantity);
    if (available < item.quantity) {
      throw new Error(
        `${item.record.productName} (${item.record.shadeName}) no longer has enough stock.`,
      );
    }
  }

  const now = new Date().toISOString();
  const decremented = resolved.items.map((item) => {
    item.record.stockQuantity -= item.quantity;
    item.record.updatedAt = now;
    return { variantId: item.record.variantId, newStock: item.record.stockQuantity };
  });
  state.processedOrderIds.push(orderId);
  writeInventoryState(state);

  return { success: true, idempotent: false, decremented };
}

export async function updateVariantStock(
  variantId: string,
  newStockQuantity: number,
): Promise<InventoryRecord | null> {
  if (!Number.isInteger(newStockQuantity) || newStockQuantity < 0) return null;

  const databaseRecords = await loadInventoryFromDatabase();
  if (databaseRecords) {
    const record = resolveInventoryRecord(databaseRecords, { variantId });
    const db = getDbPool();
    if (!record || !db) return null;

    const result = await db.query<{ stock_quantity: number | string; updated_at: Date | string }>(
      `UPDATE product_variants
          SET stock_quantity = $1, updated_at = NOW()
        WHERE id::text = $2
        RETURNING stock_quantity, updated_at`,
      [newStockQuantity, record.variantId],
    );
    const updated = result.rows[0];
    if (!updated) return null;

    const updatedRecord = {
      ...record,
      stockQuantity: Number(updated.stock_quantity),
      updatedAt: new Date(updated.updated_at).toISOString(),
    };
    syncLocalInventory(
      [{ variantId: updatedRecord.variantId, sku: updatedRecord.sku, newStock: updatedRecord.stockQuantity }],
    );
    return updatedRecord;
  }

  const state = readInventoryState();
  const record = resolveInventoryRecord(state.records, { variantId });
  if (!record) return null;

  record.stockQuantity = newStockQuantity;
  record.updatedAt = new Date().toISOString();
  writeInventoryState(state);
  return record;
}

export async function listAllInventory(params?: {
  query?: string;
  lowOnly?: boolean;
}): Promise<InventoryRecord[]> {
  const records = (await loadInventoryFromDatabase()) ?? readInventoryState().records;
  return filterAndSortInventory(records, params);
}
