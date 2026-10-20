import type { CartLine } from "@/types";
import { products } from "@/lib/mock/products";

/** Discard stale variants and malformed persisted quantities without replacing a shade. */
export function normalizeCartLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const result = new Map<string, CartLine>();
  for (const value of input) {
    if (!value || typeof value !== "object") continue;
    const line = value as Partial<CartLine>;
    const product = products.find((item) => item.slug === line.productSlug);
    const variant = product?.variants.find((item) => item.id === line.variantId);
    if (!product || !variant || !Number.isInteger(line.quantity) || (line.quantity ?? 0) <= 0) continue;
    const existing = result.get(variant.id);
    result.set(variant.id, { productSlug: product.slug, variantId: variant.id,
      quantity: Math.min(99, (existing?.quantity ?? 0) + line.quantity!),
    });
  }
  return [...result.values()].slice(0, 50);
}
