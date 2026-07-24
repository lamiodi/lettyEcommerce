/**
 * Algolia search client + sync helpers.
 *
 * Two clients are exposed:
 * - `adminAlgolia()` : uses admin key, server-only, for indexing / updates
 * - `publicAlgolia()`: search-only key, safe to send to the browser
 */
import { algoliasearch } from "algoliasearch";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let _admin: ReturnType<typeof algoliasearch> | null = null;
let _public: ReturnType<typeof algoliasearch> | null = null;

function getAdmin() {
  if (_admin) return _admin;
  const cfg = env();
  if (!cfg.ALGOLIA_APP_ID || !cfg.ALGOLIA_ADMIN_KEY) {
    throw new Error("Algolia admin credentials are not configured");
  }
  _admin = algoliasearch(cfg.ALGOLIA_APP_ID, cfg.ALGOLIA_ADMIN_KEY);
  return _admin;
}

function getPublic() {
  if (_public) return _public;
  const cfg = env();
  if (!cfg.ALGOLIA_APP_ID || !cfg.ALGOLIA_SEARCH_KEY) {
    throw new Error("Algolia search key is not configured");
  }
  _public = algoliasearch(cfg.ALGOLIA_APP_ID, cfg.ALGOLIA_SEARCH_KEY);
  return _public;
}

export const ADMIN_INDEX = {
  products: () => env().ALGOLIA_PRODUCTS_INDEX,
  collections: () => env().ALGOLIA_COLLECTIONS_INDEX,
  brands: () => env().ALGOLIA_BRANDS_INDEX,
} as const;

export type ProductRecord = {
  objectID: string;
  slug: string;
  name: string;
  description?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  base_price_usd: number;
  base_price_ngn: number;
  primary_image?: string | null;
  in_stock: boolean;
  total_stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  rating?: number;
  review_count?: number;
  created_at: number; // unix seconds
  updated_at: number;
  tags?: string[];
};

export type CollectionRecord = {
  objectID: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  product_count: number;
};

export type BrandRecord = {
  objectID: string;
  slug: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active: boolean;
};

/* ----------------------------------------------------------------- */
/*  Index settings (idempotent)                                         */
/* ----------------------------------------------------------------- */

export async function ensureIndexes() {
  try {
    const client = getAdmin();
    const products = ADMIN_INDEX.products();
    const collections = ADMIN_INDEX.collections();
    const brands = ADMIN_INDEX.brands();

    // products
    await client.setSettings({
      indexName: products,
      indexSettings: {
        searchableAttributes: ["name", "description", "brand_name", "category_name", "tags"],
        attributesForFaceting: [
          "searchable(brand_name)",
          "searchable(category_name)",
          "filterOnly(is_active)",
          "filterOnly(in_stock)",
          "filterOnly(is_featured)",
          "filterOnly(is_new)",
          "filterOnly(is_bestseller)",
        ],
        // M3: `price(...)` inside `attributesForFaceting` is deprecated by
        // Algolia. Numeric filtering is configured in
        // `numericAttributesForFiltering` below.
        numericAttributesForFiltering: ["base_price_usd", "base_price_ngn", "rating", "review_count"],
        ranking: [
          "typo",
          "geo",
          "words",
          "filters",
          "proximity",
          "attribute",
          "exact",
          "custom",
        ],
        customRanking: [
          "desc(is_featured)",
          "desc(is_bestseller)",
          "desc(is_new)",
          "desc(rating)",
          "desc(review_count)",
        ],
      },
    });

    // collections
    await client.setSettings({
      indexName: collections,
      indexSettings: {
        searchableAttributes: ["name", "description"],
        attributesForFaceting: ["filterOnly(is_active)"],
        customRanking: ["desc(product_count)"],
      },
    });

    // brands
    await client.setSettings({
      indexName: brands,
      indexSettings: {
        searchableAttributes: ["name", "description"],
        attributesForFaceting: ["filterOnly(is_active)"],
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to ensure Algolia index settings");
  }
}

/* ----------------------------------------------------------------- */
/*  Sync helpers                                                        */
/* ----------------------------------------------------------------- */

export async function upsertProduct(record: ProductRecord) {
  try {
    await getAdmin().saveObject({ indexName: ADMIN_INDEX.products(), body: record });
  } catch (err) {
    logger.error({ err, objectID: record.objectID }, "Algolia upsertProduct failed");
  }
}

export async function upsertProducts(records: ProductRecord[]) {
  if (records.length === 0) return;
  try {
    await getAdmin().saveObjects({ indexName: ADMIN_INDEX.products(), objects: records });
  } catch (err) {
    logger.error({ err, count: records.length }, "Algolia upsertProducts failed");
  }
}

export async function deleteProduct(objectID: string) {
  try {
    await getAdmin().deleteObject({ indexName: ADMIN_INDEX.products(), objectID });
  } catch (err) {
    logger.error({ err, objectID }, "Algolia deleteProduct failed");
  }
}

export async function partialUpdateProduct(objectID: string, changes: Partial<ProductRecord>) {
  try {
    await getAdmin().partialUpdateObject({
      indexName: ADMIN_INDEX.products(),
      objectID,
      attributesToUpdate: changes,
    });
  } catch (err) {
    logger.error({ err, objectID }, "Algolia partialUpdateProduct failed");
  }
}

export async function upsertCollection(record: CollectionRecord) {
  try {
    await getAdmin().saveObject({ indexName: ADMIN_INDEX.collections(), body: record });
  } catch (err) {
    logger.error({ err, objectID: record.objectID }, "Algolia upsertCollection failed");
  }
}

export async function upsertBrand(record: BrandRecord) {
  try {
    await getAdmin().saveObject({ indexName: ADMIN_INDEX.brands(), body: record });
  } catch (err) {
    logger.error({ err, objectID: record.objectID }, "Algolia upsertBrand failed");
  }
}

export { getAdmin as adminAlgolia, getPublic as publicAlgolia };
