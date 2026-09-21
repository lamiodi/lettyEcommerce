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

export async function listAllInventory(): Promise<InventoryRecord[]> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < MEMORY_TTL_MS) {
    return memoryCache.data;
  }

  try {
    const res = await fetch(`${getBackendUrl()}/api/public/inventory`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return memoryCache?.data ?? [];
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
    // Backend unreachable — fall back to the last known snapshot (or empty,
    // which makes the overlay a no-op and catalog defaults apply).
    return memoryCache?.data ?? [];
  }
}
