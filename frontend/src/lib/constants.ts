import type { Category } from "@/types";

export const SITE = {
  name: "LETTY",
  tagline: "Luxury Hair, Beauty, Fragrance & Fashion",
  email: "concierge@letty.com",
  phone: "+1 (800) 555-3889",
  address: "12 Rue Saint-Honoré, Paris / Lagos / New York",
} as const;

export const FREE_SHIPPING_THRESHOLD_USD = 150;

export interface NavLink {
  label: string;
  href: string;
}

/** Top-level navigation shown in the header. */
export const NAV_LINKS: NavLink[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Hair", href: "/shop?category=hair" },
  { label: "Fragrance", href: "/shop?category=fragrance" },
  { label: "Skincare", href: "/shop?category=skincare" },
  { label: "Makeup", href: "/shop?category=makeup" },
  { label: "Fashion", href: "/shop?category=fashion" },
  { label: "Collections", href: "/collections" },
];

/** Mega-menu column structure (keyed by category data at render time). */
export const MEGA_MENU_FEATURED = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=featured" },
  { label: "The Edit", href: "/collections/the-edit" },
] as const;

export const ANNOUNCEMENTS = [
  "Complimentary shipping on orders over $150",
  "The Golden Hour fragrance wardrobe has arrived",
  "Two deluxe samples with every order",
] as const;

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
] as const;

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  hair: "Rituals for silk-soft, luminous hair — cleansing, treatment and styling.",
  fragrance: "A wardrobe of scent: eaux de parfum, extrait and hair mists.",
  skincare: "Ceremonial skincare built on botanical actives and quiet luxury.",
  makeup: "Complexion-first makeup in couture shades and feather textures.",
  fashion: "The Atelier edit — silk, cashmere and tailoring in neutral palettes.",
  body: "Body care that turns daily routine into ritual.",
};

export function categoryDescription(category: Category | undefined): string {
  if (!category) return "";
  return CATEGORY_DESCRIPTIONS[category.slug] ?? category.description;
}
