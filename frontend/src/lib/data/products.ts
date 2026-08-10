import type { Product, ProductFilters } from "@/types";
import { products } from "@/lib/mock/products";

/**
 * Product repository.
 * Today: reads from local mock data. Later: Supabase queries —
 * function signatures stay identical, so no UI changes are required.
 */

function applyFilters(list: Product[], filters: ProductFilters): Product[] {
  let out = [...list];

  if (filters.categorySlug) {
    out = out.filter((p) => p.categorySlug === filters.categorySlug);
  }
  if (filters.subcategorySlug) {
    out = out.filter((p) => p.subcategorySlug === filters.subcategorySlug);
  }
  if (filters.collectionSlug) {
    out = out.filter((p) => p.collectionSlugs.includes(filters.collectionSlug!));
  }
  if (filters.brandSlugs?.length) {
    out = out.filter((p) => filters.brandSlugs!.includes(p.brandSlug));
  }
  if (filters.minPrice != null) {
    out = out.filter((p) => p.basePriceUsd >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    out = out.filter((p) => p.basePriceUsd <= filters.maxPrice!);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase().trim();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brandSlug.replaceAll("-", " ").includes(q) ||
        p.categorySlug.includes(q),
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

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  return applyFilters(products, filters);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const set = new Set(slugs);
  return products.filter((p) => set.has(p.slug));
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  return products.filter((p) => p.isBestSeller).slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return products.filter((p) => p.isNew).slice(0, limit);
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const product = await getProductBySlug(slug);
  if (!product) return [];
  const related = await getProductsBySlugs(product.relatedSlugs);
  if (related.length >= limit) return related.slice(0, limit);
  const fillers = products.filter(
    (p) =>
      p.slug !== slug &&
      !related.some((r) => r.slug === p.slug) &&
      p.categorySlug === product.categorySlug,
  );
  return [...related, ...fillers].slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  return applyFilters(products, { query, sort: "featured" });
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const prices = products.map((p) => p.basePriceUsd);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
