/**
 * Authoritative variant image resolver for orders, receipts, emails, and catalog snapshots.
 * Guarantees that shade/color packaging (e.g. Noir vs Ivory for mwah lip balm)
 * maps to the true variant image, preventing cross-shade snapshot mixups.
 */

export interface VariantImageLookup {
  primaryImage?: string | null;
  sku?: string | null;
  options?: Array<{ name: string; value: string }> | Record<string, string> | null;
  color?: string | null;
  productSlug?: string | null;
  variantImageUrl?: string | null;
}

export const MWAH_IVORY_IMAGE = "https://www.houseofletty.com/products/mwah/mwah-ivory.webp";
export const MWAH_NOIR_IMAGE = "https://www.houseofletty.com/products/mwah/mwah-noir.webp";

export function resolveVariantImageUrl(item: VariantImageLookup): string | null {
  const sku = (item.sku ?? "").trim().toUpperCase();
  const color = (item.color ?? "").trim().toLowerCase();
  const slug = (item.productSlug ?? "").trim().toLowerCase();

  let optionValues = "";
  if (Array.isArray(item.options)) {
    optionValues = item.options.map((o) => `${o.name}: ${o.value}`.toLowerCase()).join(" ");
  } else if (item.options && typeof item.options === "object") {
    optionValues = Object.entries(item.options).map(([k, v]) => `${k}: ${v}`.toLowerCase()).join(" ");
  }

  // 1. Mwah Lip Balm specific shades: Noir Edition vs Ivory Edition
  const isNoir = sku === "LET-MWAH-NR" || color.includes("noir") || optionValues.includes("noir");
  const isIvory = sku === "LET-MWAH-IV" || color.includes("ivory") || optionValues.includes("ivory");

  if (isNoir) return MWAH_NOIR_IMAGE;
  if (isIvory) return MWAH_IVORY_IMAGE;

  const isMwah = slug.includes("mwah") || sku.includes("MWAH") || color.includes("mwah") || optionValues.includes("mwah");
  if (isMwah) {
    if (item.primaryImage?.includes("mwah-noir")) return MWAH_NOIR_IMAGE;
    if (item.primaryImage?.includes("mwah-ivory")) return MWAH_IVORY_IMAGE;
  }

  // 2. Direct variant image from database/catalog
  if (item.variantImageUrl && typeof item.variantImageUrl === "string" && item.variantImageUrl.trim()) {
    return item.variantImageUrl.trim();
  }

  // 3. Fallback to provided primary image
  if (item.primaryImage && typeof item.primaryImage === "string" && item.primaryImage.trim()) {
    return item.primaryImage.trim();
  }

  return null;
}
