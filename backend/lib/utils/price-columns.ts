/**
 * Per-currency price column resolvers.
 * Single source of truth for mapping a `Currency` to the matching numeric
 * column on `products`, `product_variants`, `shipping_methods`, `coupons`.
 */
import type { Currency } from "@/lib/validations";

const COL = {
  base_price: {
    USD: "base_price_usd",
    EUR: "base_price_eur",
    GBP: "base_price_gbp",
    NGN: "base_price_ngn",
    GHS: "base_price_ghs",
    ZAR: "base_price_zar",
    KES: "base_price_kes",
  },
  compare_at_price: {
    USD: "compare_at_price_usd",
    EUR: "compare_at_price_eur",
    GBP: "compare_at_price_gbp",
    NGN: "compare_at_price_ngn",
    GHS: "compare_at_price_ghs",
    ZAR: "compare_at_price_zar",
    KES: "compare_at_price_kes",
  },
  price_override: {
    USD: "price_override_usd",
    EUR: "price_override_eur",
    GBP: "price_override_gbp",
    NGN: "price_override_ngn",
    GHS: "price_override_ghs",
    ZAR: "price_override_zar",
    KES: "price_override_kes",
  },
  rate: {
    USD: "rate_usd",
    EUR: "rate_eur",
    GBP: "rate_gbp",
    NGN: "rate_ngn",
    GHS: "rate_ghs",
    ZAR: "rate_zar",
    KES: "rate_kes",
  },
  free_over: {
    USD: "free_over_usd",
    EUR: "free_over_eur",
    GBP: "free_over_gbp",
    NGN: "free_over_ngn",
    GHS: "free_over_ghs",
    ZAR: "free_over_zar",
    KES: "free_over_kes",
  },
  min_subtotal: {
    USD: "min_subtotal_usd",
    EUR: "min_subtotal_eur",
    GBP: "min_subtotal_gbp",
    NGN: "min_subtotal_ngn",
    GHS: "min_subtotal_ghs",
    ZAR: "min_subtotal_zar",
    KES: "min_subtotal_kes",
  },
  max_discount: {
    USD: "max_discount_usd",
    EUR: "max_discount_eur",
    GBP: "max_discount_gbp",
    NGN: "max_discount_ngn",
    GHS: "max_discount_ghs",
    ZAR: "max_discount_zar",
    KES: "max_discount_kes",
  },
} as const satisfies Record<string, Record<Currency, string>>;

type Field = keyof typeof COL;

export function priceColumn(field: Field, currency: Currency): string {
  const m = COL[field];
  const col = (m as Record<string, string>)[currency];
  if (!col) {
    throw new Error(`No column for ${field} in ${currency}`);
  }
  return col;
}
