import type { Category } from "@/types";

export const SITE = {
  name: "LETTY",
  tagline: "The House of Beauty, Fragrance, Fashion & Eyewear",
  email: "lettybeautyco@gmail.com",
  phone: "+44 7311 564331",
  address: "12 Rue Saint-Honoré, Paris / Lagos / London",
} as const;

export const FREE_SHIPPING_THRESHOLD_USD = 150;
export const STANDARD_SHIPPING_FLAT_USD = 4.99;

export type ShippingDestinationKey = "UK" | "Europe" | "US_CA" | "ROW";

export interface ShippingDestinationInfo {
  key: ShippingDestinationKey;
  label: string;
  flag: string;
  deliveryTime: string;
  gbpRate: number;
  eurRate?: number;
  flatGbp: number;
  flatEur?: number;
  estimate: string;
}

export const SHIPPING_DESTINATIONS: Record<ShippingDestinationKey, ShippingDestinationInfo> = {
  UK: {
    key: "UK",
    label: "United Kingdom",
    flag: "🇬🇧",
    deliveryTime: "2–3 Business Days",
    estimate: "2–3 Business Days",
    gbpRate: 4.99,
    flatGbp: 4.99,
  },
  Europe: {
    key: "Europe",
    label: "Europe",
    flag: "🇪🇺",
    deliveryTime: "3–5 Business Days",
    estimate: "3–5 Business Days",
    gbpRate: 12.82, // €15.00 equivalent in GBP
    eurRate: 15.00,
    flatGbp: 12.82,
    flatEur: 15.00,
  },
  US_CA: {
    key: "US_CA",
    label: "USA / Canada",
    flag: "🇺🇸",
    deliveryTime: "3–5 Business Days",
    estimate: "3–5 Business Days",
    gbpRate: 25.00,
    flatGbp: 25.00,
  },
  ROW: {
    key: "ROW",
    label: "Rest of World",
    flag: "🌍",
    deliveryTime: "5–7 Business Days",
    estimate: "5–7 Business Days",
    gbpRate: 30.00,
    flatGbp: 30.00,
  },
};

const EUROPE_COUNTRY_CODES = new Set([
  "FR", "DE", "IT", "ES", "NL", "BE", "IE", "CH", "AT", "SE",
  "NO", "DK", "FI", "PT", "GR", "PL", "CZ", "HU", "RO", "BG",
  "HR", "SK", "SI", "EE", "LV", "LT", "LU", "CY", "MT", "IS",
  "AL", "AD", "AM", "AZ", "BY", "BA", "GE", "LI", "MD", "MC",
  "ME", "MK", "SM", "RS", "UA", "VA", "XK",
]);

export function getShippingDestinationKey(countryCodeOrName?: string): ShippingDestinationKey {
  if (!countryCodeOrName) return "UK";
  const c = countryCodeOrName.trim().toUpperCase();
  if (
    c === "GB" ||
    c === "UK" ||
    c === "UNITED KINGDOM" ||
    c === "ENGLAND" ||
    c === "SCOTLAND" ||
    c === "WALES" ||
    c === "NORTHERN IRELAND" ||
    c === "IM" ||
    c === "JE" ||
    c === "GG"
  ) {
    return "UK";
  }
  if (
    c === "US" ||
    c === "USA" ||
    c === "UNITED STATES" ||
    c === "UNITED STATES OF AMERICA" ||
    c === "CA" ||
    c === "CAN" ||
    c === "CANADA"
  ) {
    return "US_CA";
  }
  if (EUROPE_COUNTRY_CODES.has(c)) return "Europe";

  const lower = countryCodeOrName.trim().toLowerCase();
  const europeanNames = [
    "france", "germany", "italy", "spain", "netherlands", "belgium",
    "ireland", "switzerland", "austria", "sweden", "norway", "denmark",
    "finland", "portugal", "greece", "poland", "czech", "hungary",
    "romania", "bulgaria", "croatia", "slovakia", "slovenia", "estonia",
    "latvia", "lithuania", "luxembourg", "cyprus", "malta", "iceland",
    "albania", "andorra", "armenia", "azerbaijan", "belarus", "bosnia",
    "georgia", "liechtenstein", "moldova", "monaco", "montenegro",
    "macedonia", "san marino", "serbia", "ukraine", "vatican", "kosovo",
  ];
  if (europeanNames.some((n) => lower.includes(n))) return "Europe";

  return "ROW";
}

export function calculateShipping(
  subtotal: number,
  countryCodeOrName = "GB",
  currency = "GBP",
  _methodId = "standard",
): number {
  if (subtotal <= 0) return 0;

  const destKey = getShippingDestinationKey(countryCodeOrName);
  const dest = SHIPPING_DESTINATIONS[destKey];

  if (currency === "EUR" && dest.eurRate != null) {
    return dest.eurRate;
  }
  return dest.gbpRate;
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
  { label: "Instagram", href: "https://instagram.com/lettybeautyofficial" },
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
