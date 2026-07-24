import type { CartLine, CartLineDetailed } from "@/types";
import { products } from "@/lib/mock/products";

/**
 * Joins raw cart lines with catalog data.
 * Client-safe today (local mock); when the data layer moves to Supabase,
 * cart lines will be hydrated server-side instead.
 */
export function detailCartLines(lines: CartLine[]): CartLineDetailed[] {
  return lines.flatMap((line) => {
    const product = products.find((p) => p.slug === line.productSlug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) return [];
    const unitPrice = variant.priceOverrideUsd ?? product.basePriceUsd;
    return [
      {
        ...line,
        product,
        variant,
        unitPrice,
        lineTotal: unitPrice * line.quantity,
      },
    ];
  });
}

export function cartSubtotal(lines: CartLineDetailed[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}
