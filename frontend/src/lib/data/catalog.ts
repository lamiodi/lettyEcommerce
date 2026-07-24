import type { Brand, Category, Collection } from "@/types";
import { brands, categories, collections } from "@/lib/mock/catalog";
import { products } from "@/lib/mock/products";

/** Catalog taxonomy repositories (brands, categories, collections). */

export async function getBrands(): Promise<Brand[]> {
  return brands;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getCollections(): Promise<Collection[]> {
  return collections.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.collectionSlugs.includes(c.slug)).length,
  }));
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) return null;
  return {
    ...collection,
    productCount: products.filter((p) => p.collectionSlugs.includes(slug)).length,
  };
}
