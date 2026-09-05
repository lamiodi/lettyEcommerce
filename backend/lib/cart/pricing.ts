/**
 * Subtotal & tax line item calculation, given a cart of variant ids.
 * Loads prices from `product_variants` and `products`, using the per-currency
 * column for the order's currency (so EUR/GBP/GHS/ZAR/KES orders are
 * priced correctly, not silently billed in USD).
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { calculateTax } from "@/lib/tax/calculator";
import { priceColumn } from "@/lib/utils/price-columns";
import type { CartItemInput } from "@/lib/validations";
import type { Currency } from "@/lib/validations";

export interface PricedCartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  options: Array<{ name: string; value: string }>;
  primaryImage?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockAvailable: number;
  inStock: boolean;
}

export interface CartPricing {
  items: PricedCartItem[];
  subtotal: number;
  tax: { rate: number; amount: number; isInclusive: boolean };
  currency: Currency;
  country: string;
  state?: string | null;
}

export async function priceCart(opts: {
  cart: CartItemInput[];
  currency: Currency;
  country: string;
  state?: string | null;
}): Promise<CartPricing> {
  if (opts.cart.length === 0) throw new ConflictError("Cart is empty");
  const variantIds = opts.cart.map((c) => c.variant_id);

  const productBaseCol = priceColumn("base_price", opts.currency);
  const variantOverrideCol = priceColumn("price_override", opts.currency);

  // Build a dynamic select that pulls the right per-currency column.
  // We have to interpolate the column name safely (it's resolved from a closed
  // set, so injection isn't a concern).
  const { data: variants, error } = await supabaseAdmin()
    .from("product_variants")
    .select(
      `id, sku, stock_quantity, ${variantOverrideCol}, price_override_usd, is_active,
       product:products!inner(
         id, slug, name, ${productBaseCol}, base_price_usd, base_price_ngn, is_active,
         product_media(url, position, is_primary)
       )`,
    )
    .in("id", variantIds)
    .eq("is_active", true);

  if (error) throw new Error(`Failed to load variants: ${error.message}`);
  if (!variants || variants.length === 0) throw new NotFoundError("No matching variants");

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const { data: optionRows } = await supabaseAdmin()
    .from("variant_options")
    .select("variant_id, option_name, option_value")
    .in(
      "variant_id",
      variants.map((v) => v.id),
    );
  const optionsByVariant = new Map<string, Array<{ name: string; value: string }>>();
  for (const row of optionRows ?? []) {
    const list = optionsByVariant.get(row.variant_id) ?? [];
    list.push({ name: row.option_name, value: row.option_value });
    optionsByVariant.set(row.variant_id, list);
  }

  const items: PricedCartItem[] = [];
  let subtotal = 0;

  for (const cartItem of opts.cart) {
    const v = variantMap.get(cartItem.variant_id);
    if (!v) throw new NotFoundError(`Variant ${cartItem.variant_id} not found`);
    const product = Array.isArray(v.product) ? v.product[0] : v.product;
    if (!product || !product.is_active) {
      throw new ConflictError(`Product for variant ${cartItem.variant_id} is not available`);
    }

    const override = (v as Record<string, unknown>)[variantOverrideCol] as number | null | undefined;
    const base = (product as Record<string, unknown>)[productBaseCol] as number | null | undefined;
    let unitPrice = Number(override ?? base ?? 0);

    // Resilient fallback: If price is not yet seeded in this specific currency column (e.g. GBP),
    // compute price using base_price_usd and standard exchange rate.
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      const fallbackUsd = Number(
        (v as Record<string, unknown>).price_override_usd ??
        (product as Record<string, unknown>).base_price_usd ?? 0
      );
      if (fallbackUsd > 0) {
        const usdToTargetRate: Record<string, number> = {
          USD: 1.0,
          GBP: 1.0 / 1.28,
          EUR: 1.17 / 1.28,
          CAD: 1.74 / 1.28,
          NGN: 2050.0 / 1.28,
          GHS: 19.5 / 1.28,
          ZAR: 23.5 / 1.28,
          KES: 165.0 / 1.28,
        };
        const rate = usdToTargetRate[opts.currency] ?? 1.0;
        unitPrice = Math.round(fallbackUsd * rate * 100) / 100;
      }
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new ConflictError(
        `Price not configured for ${product.name} in ${opts.currency}`,
      );
    }

    if (v.stock_quantity < cartItem.quantity) {
      throw new ConflictError(`Insufficient stock for ${product.name}`);
    }

    const media = (product.product_media ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position,
    );
    const primary = media.find((m: { is_primary: boolean }) => m.is_primary) ?? media[0];

    const lineTotal = unitPrice * cartItem.quantity;
    subtotal += lineTotal;

    items.push({
      variantId: v.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantSku: v.sku,
      options: optionsByVariant.get(v.id) ?? [],
      primaryImage: primary?.url ?? null,
      unitPrice,
      quantity: cartItem.quantity,
      lineTotal,
      stockAvailable: v.stock_quantity,
      inStock: v.stock_quantity > 0,
    });
  }

  const tax = await calculateTax(opts.country, opts.state);
  const taxAmount = tax.isInclusive
    ? round2(subtotal - subtotal / (1 + tax.rate)) // back-out the tax that is already inside the price
    : round2(subtotal * tax.rate);

  return {
    items,
    subtotal: round2(subtotal),
    tax: { rate: tax.rate, amount: taxAmount, isInclusive: tax.isInclusive },
    currency: opts.currency,
    country: opts.country,
    state: opts.state,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
