import type { Product, ProductFilters, ProductVariant } from "@/types";
import { products as fallbackProducts } from "@/lib/mock/products";
import { availableStock } from "@/lib/inventory-stock";
import { listAllInventory } from "@/lib/inventory/inventory-store";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hjqylutputroxwmicdaq.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcXlsdXRwdXRyb3h3bWljZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTgyMjksImV4cCI6MjEwNDA5NDIyOX0.kxj1vr_RbgLrHhKdIM-GRgNxJEI0xsvIf_N1AEikv8s";

interface DatabaseVariantRow {
  id: string;
  sku: string;
  color?: string | null;
  color_hex?: string | null;
  stock_quantity?: number | null;
  reserved_quantity?: number | null;
  price_override_usd?: number | null;
  image_url?: string | null;
  images?: string[] | null;
  variant_options?: Array<{ option_name: string; option_value: string }>;
}

interface DatabaseProductRow {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  base_price_usd?: number | null;
  base_price_gbp?: number | null;
  base_price_ngn?: number | null;
  is_new?: boolean | null;
  is_bestseller?: boolean | null;
  is_featured?: boolean | null;
  is_vegan?: boolean | null;
  rating?: number | null;
  review_count?: number | null;
  details?: string[] | null;
  what_it_is?: string | null;
  what_it_does?: string | null;
  what_else_to_know?: string[] | null;
  ingredients?: string | null;
  brands?: { id: string; name: string; slug: string } | null;
  categories?: { id: string; name: string; slug: string } | null;
  product_variants?: DatabaseVariantRow[] | null;
  product_media?: Array<{ id: string; url: string; alt_text?: string; position: number; is_primary: boolean }> | null;
}

let dbProductsCache: { data: Product[]; fetchedAt: number } | null = null;
const DB_CACHE_TTL = 30_000;

function mapDatabaseRowToProduct(row: DatabaseProductRow): Product {
  const fallback = fallbackProducts.find((p) => p.slug === row.slug);
  const isPreorder = row.slug === "letty-mwah-lip-balm" || (fallback?.isPreorder ?? false);

  const mappedVariants: ProductVariant[] =
    row.product_variants && row.product_variants.length > 0
      ? row.product_variants.map((v) => {
          const fallbackVariant = fallback?.variants.find((fv) => fv.sku === v.sku || fv.id === v.id);
          const optionEdition = v.variant_options?.find(
            (o) => o.option_name === "Edition" || o.option_name === "Shade",
          )?.option_value;
          const optionSize = v.variant_options?.find((o) => o.option_name === "Size")?.option_value;
          return {
            id: v.id,
            sku: v.sku,
            color: v.color || optionEdition || fallbackVariant?.color || "Standard",
            colorHex: v.color_hex || fallbackVariant?.colorHex,
            size: optionSize || fallbackVariant?.size,
            priceOverrideUsd: v.price_override_usd ?? fallbackVariant?.priceOverrideUsd,
            stockQuantity: Number(v.stock_quantity ?? fallbackVariant?.stockQuantity ?? (isPreorder ? 50 : 0)),
            image: v.image_url || fallbackVariant?.image,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : fallbackVariant?.images,
          };
        })
      : (fallback?.variants ?? []);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? fallback?.tagline,
    brandSlug: row.brands?.slug ?? fallback?.brandSlug ?? "letty",
    categorySlug:
      row.categories?.slug === "makeup" ||
      row.categories?.slug === "lip-liner" ||
      row.categories?.slug === "lip-gloss" ||
      row.categories?.slug === "lashes" ||
      row.categories?.slug === "beauty"
        ? "makeup-beauty"
        : row.categories?.slug ?? fallback?.categorySlug ?? "makeup-beauty",
    subcategorySlug:
      row.categories?.slug === "makeup"
        ? fallback?.subcategorySlug ?? "lip-care"
        : row.categories?.slug ?? fallback?.subcategorySlug,
    description: row.description ?? fallback?.description ?? "",
    details: Array.isArray(row.details) && row.details.length > 0 ? row.details : (fallback?.details ?? []),
    ingredients: row.ingredients ?? fallback?.ingredients,
    whatItIs: row.what_it_is ?? fallback?.whatItIs,
    whatItDoes: row.what_it_does ?? fallback?.whatItDoes,
    whatElseToKnow:
      Array.isArray(row.what_else_to_know) && row.what_else_to_know.length > 0
        ? row.what_else_to_know
        : fallback?.whatElseToKnow,
    howToUseSteps: fallback?.howToUseSteps,
    proTip: fallback?.proTip,
    beautyHack: fallback?.beautyHack,
    pairWith: fallback?.pairWith,
    basePriceUsd: Number(row.base_price_usd ?? row.base_price_gbp ?? fallback?.basePriceUsd ?? 0),
    compareAtPriceUsd: fallback?.compareAtPriceUsd,
    media: fallback?.media ?? [],
    variants: mappedVariants,
    rating: Number(row.rating ?? fallback?.rating ?? 0),
    reviewCount: Number(row.review_count ?? fallback?.reviewCount ?? 0),
    isNew: Boolean(row.is_new ?? fallback?.isNew),
    isBestSeller: Boolean(row.is_bestseller ?? fallback?.isBestSeller),
    isVegan: Boolean(row.is_vegan ?? fallback?.isVegan),
    isPreorder,
    preorderDispatch: fallback?.preorderDispatch ?? "Late October–early November 2026",
    collectionSlugs: fallback?.collectionSlugs ?? ["the-edit"],
    relatedSlugs: fallback?.relatedSlugs ?? [],
  };
}

async function loadDatabaseCatalog(): Promise<Product[]> {
  if (dbProductsCache && Date.now() - dbProductsCache.fetchedAt < DB_CACHE_TTL) {
    return dbProductsCache.data;
  }
  try {
    const url = `${SUPABASE_URL}/rest/v1/products?select=*,brands(*),categories(*),product_variants(*,variant_options(*)),product_media(*)&is_active=eq.true&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
    const rows = (await res.json()) as DatabaseProductRow[];
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Empty Supabase catalog");

    const dbCatalog = rows.map(mapDatabaseRowToProduct);
    const dbSlugs = new Set(dbCatalog.map((p) => p.slug));
    const merged = [...dbCatalog, ...fallbackProducts.filter((p) => !dbSlugs.has(p.slug))];

    dbProductsCache = { data: merged, fetchedAt: Date.now() };
    return merged;
  } catch {
    return fallbackProducts;
  }
}

function applyFilters(list: Product[], filters: ProductFilters): Product[] {
  let out = [...list];

  if (filters.categorySlug) {
    const isMakeup = filters.categorySlug === "makeup-beauty" || filters.categorySlug === "makeup";
    out = out.filter((product) =>
      isMakeup
        ? product.categorySlug === "makeup-beauty" || product.categorySlug === "makeup"
        : product.categorySlug === filters.categorySlug,
    );
  }
  if (filters.subcategorySlug) {
    out = out.filter((product) => product.subcategorySlug === filters.subcategorySlug);
  }
  if (filters.collectionSlug) {
    out = out.filter((product) => product.collectionSlugs.includes(filters.collectionSlug!));
  }
  if (filters.brandSlugs?.length) {
    out = out.filter((product) => filters.brandSlugs!.includes(product.brandSlug));
  }
  if (filters.minPrice != null) {
    out = out.filter((product) => product.basePriceUsd >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    out = out.filter((product) => product.basePriceUsd <= filters.maxPrice!);
  }
  if (filters.query) {
    const query = filters.query.toLowerCase().trim();
    out = out.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brandSlug.replaceAll("-", " ").includes(query) ||
        product.categorySlug.includes(query),
    );
  }

  switch (filters.sort) {
    case "price-asc":
      out.sort((a, b) => a.basePriceUsd - b.basePriceUsd);
      break;
    case "price-desc":
      out.sort((a, b) => b.basePriceUsd - a.basePriceUsd);
      break;
    case "rating":
      out.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      out.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      break;
    case "featured":
    default:
      out.sort(
        (a, b) =>
          Number(b.isBestSeller ?? false) - Number(a.isBestSeller ?? false) ||
          b.reviewCount - a.reviewCount,
      );
  }

  return out;
}

async function overlayInventory(catalog: Product[]): Promise<Product[]> {
  try {
    const inventory = await listAllInventory();
    const stockBySku = new Map(inventory.map((record) => [record.sku, record]));
    const stockByVariantId = new Map(
      inventory.map((record) => [record.variantId, record]),
    );

    return catalog.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => {
        const inv = stockByVariantId.get(variant.id) ?? stockBySku.get(variant.sku);
        const liveStock = inv ? availableStock(inv) : undefined;
        return {
          ...variant,
          stockQuantity:
            liveStock !== undefined
              ? liveStock
              : (variant.stockQuantity ?? (product.isPreorder ? 50 : 0)),
        };
      }),
    }));
  } catch {
    return catalog;
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const catalog = await loadDatabaseCatalog();
  return applyFilters(await overlayInventory(catalog), filters);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const catalog = await loadDatabaseCatalog();
  const product = catalog.find((candidate) => candidate.slug === slug);
  if (!product) return null;
  return (await overlayInventory([product]))[0] ?? null;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const catalog = await loadDatabaseCatalog();
  const slugSet = new Set(slugs);
  return overlayInventory(catalog.filter((product) => slugSet.has(product.slug)));
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const catalog = await loadDatabaseCatalog();
  return overlayInventory(catalog.filter((product) => product.isBestSeller).slice(0, limit));
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const catalog = await loadDatabaseCatalog();
  return overlayInventory(catalog.filter((product) => product.isNew).slice(0, limit));
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const catalog = await overlayInventory(await loadDatabaseCatalog());
  const product = catalog.find((candidate) => candidate.slug === slug);
  if (!product) return [];

  const relatedBySlug = new Map(catalog.map((candidate) => [candidate.slug, candidate]));
  const related = product.relatedSlugs
    .map((relatedSlug) => relatedBySlug.get(relatedSlug))
    .filter((candidate): candidate is Product => Boolean(candidate));
  if (related.length >= limit) return related.slice(0, limit);

  const fillers = catalog.filter(
    (candidate) =>
      candidate.slug !== slug &&
      !related.some((relatedProduct) => relatedProduct.slug === candidate.slug) &&
      candidate.categorySlug === product.categorySlug,
  );
  return [...related, ...fillers].slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const catalog = await loadDatabaseCatalog();
  return applyFilters(await overlayInventory(catalog), { query, sort: "featured" });
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const catalog = await loadDatabaseCatalog();
  if (catalog.length === 0) return { min: 0, max: 0 };
  const prices = catalog.map((product) => product.basePriceUsd);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
