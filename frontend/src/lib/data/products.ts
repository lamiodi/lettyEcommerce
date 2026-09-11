import type { Product, ProductFilters } from "@/types";
import { products } from "@/lib/mock/products";
import { listAllInventory } from "@/lib/inventory/inventory-store";

/**
 * Product repository with a live inventory overlay. Catalog copy and media
 * remain centralized in mock data while stock comes from the inventory store.
 */

function applyFilters(list: Product[], filters: ProductFilters): Product[] {
  let out = [...list];

  if (filters.categorySlug) {
    out = out.filter((product) => product.categorySlug === filters.categorySlug);
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
    const stockBySku = new Map(inventory.map((record) => [record.sku, record.stockQuantity]));
    const stockByVariantId = new Map(
      inventory.map((record) => [record.variantId, record.stockQuantity]),
    );

    return catalog.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        stockQuantity:
          stockByVariantId.get(variant.id) ?? stockBySku.get(variant.sku) ?? variant.stockQuantity,
      })),
    }));
  } catch {
    return catalog;
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  return applyFilters(await overlayInventory(products), filters);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = products.find((candidate) => candidate.slug === slug);
  if (!product) return null;
  return (await overlayInventory([product]))[0] ?? null;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const slugSet = new Set(slugs);
  return overlayInventory(products.filter((product) => slugSet.has(product.slug)));
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  return overlayInventory(products.filter((product) => product.isBestSeller).slice(0, limit));
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return overlayInventory(products.filter((product) => product.isNew).slice(0, limit));
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const catalog = await overlayInventory(products);
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
  return applyFilters(await overlayInventory(products), { query, sort: "featured" });
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  if (products.length === 0) return { min: 0, max: 0 };
  const prices = products.map((product) => product.basePriceUsd);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
