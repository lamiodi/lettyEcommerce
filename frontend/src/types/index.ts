/**
 * Shared domain types.
 *
 * These mirror the normalized Supabase schema in the enterprise blueprint
 * (brands, categories, collections, products, variants, media, reviews)
 * so the mock data layer can be swapped for Supabase queries later
 * without touching UI components.
 */

import type { ImageKey } from "@/lib/images";

export interface Brand {
  id: string;
  slug: string;
  name: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId?: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageKey: ImageKey;
  productCount?: number;
}

export interface ProductMedia {
  id: string;
  imageKey: ImageKey;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  priceOverrideUsd?: number;
  stockQuantity: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Short editorial mood line, e.g. "Warm. Sensual. Addictive." */
  tagline?: string;
  brandSlug: string;
  categorySlug: string;
  /** Finer grouping within a category — e.g. fashion "dresses",
   *  fragrance "for-her", eyewear "signatures". */
  subcategorySlug?: string;
  description: string;
  details: string[];
  ingredients?: string;
  basePriceUsd: number;
  compareAtPriceUsd?: number;
  media: ProductMedia[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  collectionSlugs: string[];
  relatedSlugs: string[];
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  verified: boolean;
  date: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatarKey: ImageKey;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

// ---------- Commerce (client state) ----------

export interface CartLine {
  productSlug: string;
  variantId: string;
  quantity: number;
}

export interface CartLineDetailed extends CartLine {
  product: Product;
  variant: ProductVariant;
  unitPrice: number;
  lineTotal: number;
}

// ---------- Filtering / sorting ----------

export type SortOption =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface ProductFilters {
  categorySlug?: string;
  subcategorySlug?: string;
  collectionSlug?: string;
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sort?: SortOption;
}
