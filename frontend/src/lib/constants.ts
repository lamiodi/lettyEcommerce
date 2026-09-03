import type { Category } from "@/types";

export const SITE = {
  name: "LETTY",
  tagline: "The House of Beauty, Fragrance, Fashion & Eyewear",
  email: "lettybeautyco@gmail.com",
  phone: "+1 (800) 555-3889",
  address: "12 Rue Saint-Honoré, Paris / Lagos / New York",
} as const;

export const FREE_SHIPPING_THRESHOLD_USD = 150;
export const STANDARD_SHIPPING_FLAT_USD = 12;

export function calculateShipping(subtotal: number, methodId = "standard"): number {
  if (subtotal <= 0) return 0;
  if (methodId === "standard") {
    return subtotal >= FREE_SHIPPING_THRESHOLD_USD ? 0 : STANDARD_SHIPPING_FLAT_USD;
  }
  if (methodId === "express") return 25;
  if (methodId === "overnight") return 45;
  return 0;
}

export interface NavLink {
  label: string;
  href: string;
}

/** Top-level navigation shown in the header. */
export const NAV_LINKS: NavLink[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Makeup & Beauty", href: "/departments/makeup-beauty" },
  { label: "Fashion", href: "/departments/fashion" },
  { label: "Fragrances", href: "/departments/fragrances" },
  { label: "Eyewear", href: "/departments/eyewear" },
  { label: "Collections", href: "/collections" },
];

/** Human-readable labels for product subcategory slugs (URL `sub` param). */
export const SUBCATEGORY_LABELS: Record<string, string> = {
  dresses: "Dresses",
  sets: "Sets",
  tops: "Tops",
  bottoms: "Bottoms",
  "for-her": "For Her",
  "for-him": "For Him",
  unisex: "Unisex",
  "new-season": "New Season",
  signatures: "The Signatures",
};

/** Mega-menu column structure (keyed by category data at render time). */
export const MEGA_MENU_FEATURED = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=featured" },
  { label: "The Edit", href: "/collections/the-edit" },
] as const;

export const ANNOUNCEMENTS = [
  "COMPLIMENTARY DELIVERY ON ORDERS OVER £150",
  "SIGNATURE LETTY PACKAGING WITH EVERY ORDER",
  "COMPLIMENTARY SAMPLES WITH SELECTED ORDERS",
] as const;

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
] as const;

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  hair: "Rituals for silk-soft, luminous hair — cleansing, treatment and styling.",
  fragrance: "A wardrobe of scent: eaux de parfum, extrait and hair mists.",
  skincare: "Ceremonial skincare built on botanical actives and quiet luxury.",
  makeup: "Considered colour. Refined textures. Made for your everyday ritual.",
  fashion: "The Atelier edit — silk, cashmere and tailoring in neutral palettes.",
  body: "Body care that turns daily routine into ritual.",
  eyewear: "Sculpted frames and signature silhouettes — designed to be noticed.",
};

export function categoryDescription(category: Category | undefined): string {
  if (!category) return "";
  return CATEGORY_DESCRIPTIONS[category.slug] ?? category.description;
}
