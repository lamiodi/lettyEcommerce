import "server-only";

import { getBackendUrl } from "@/lib/backend";

/**
 * Live inventory overlay for the storefront catalog.
 *
 * Stock levels come from the backend's public inventory endpoint — the
 * frontend never talks to Postgres directly (no DB credentials here, no
 * serverless-hostile local cache files).
 */

export interface InventoryRecord {
  variantId: string;
  sku: string;
  productSlug: string | null;
  productName: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

interface ApiRow {
  variant_id: string;
  sku: string;
  product_slug: string | null;
  product_name: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

let memoryCache: { data: InventoryRecord[]; fetchedAt: number } | null = null;
const MEMORY_TTL_MS = 60_000;
const MAX_STALE_MS = 5 * 60_000;
function lastKnownInventory(): InventoryRecord[] {
  return memoryCache && Date.now() - memoryCache.fetchedAt < MAX_STALE_MS ? memoryCache.data : [];
}
let inFlight: Promise<InventoryRecord[]> | null = null;
let retryAfter = 0;

export async function listAllInventory(): Promise<InventoryRecord[]> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < MEMORY_TTL_MS) {
    return memoryCache.data;
  }
  if (inFlight) return inFlight;
  if (Date.now() < retryAfter) return lastKnownInventory();
  inFlight = fetchInventory().finally(() => { inFlight = null; });
  return inFlight;
}

async function fetchInventory(): Promise<InventoryRecord[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/public/inventory`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) throw new Error("Inventory unavailable");
    const json = (await res.json()) as { data?: ApiRow[] };
    const data: InventoryRecord[] = (json.data ?? []).map((row) => ({
      variantId: row.variant_id,
      sku: row.sku,
      productSlug: row.product_slug,
      productName: row.product_name,
      stockQuantity: Number(row.stock_quantity ?? 0),
      reservedQuantity: Number(row.reserved_quantity ?? 0),
      lowStockThreshold: Number(row.low_stock_threshold ?? 5),
      updatedAt: row.updated_at,
    }));
    memoryCache = { data, fetchedAt: Date.now() };
    return data;
  } catch {
    retryAfter = Date.now() + 15_000;
    // Backend unreachable — fall back to the last known snapshot (or empty,
    // which makes availability unconfirmed rather than using catalog stock).
    return lastKnownInventory();
  }
}
