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
import { formatEmailImageUrl } from "@/lib/email/brand";
import { getExchangeRates, convertGbpPrice, roundPrice } from "@/lib/currency/fx";

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
  type SupabaseSelect = {
    select: (query: string) => {
      in: (col: string, vals: string[]) => {
        eq: (col: string, val: boolean) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      };
    };
  };

  const { data: rawVariants, error } = await (supabaseAdmin()
    .from("product_variants") as unknown as SupabaseSelect)
    .select(
      `id, sku, stock_quantity, ${variantOverrideCol}, price_override_gbp, price_override_usd, is_active,
       product:products!inner(
         id, slug, name, ${productBaseCol}, base_price_gbp, base_price_usd, is_active,
         product_media(url, position, is_primary)
       )`,
    )
    .in("id", variantIds)
    .eq("is_active", true);

  if (error) throw new Error(`Failed to load variants: ${error.message}`);
  const variants = (rawVariants ?? []) as Array<Record<string, unknown> & { id: string; sku: string; stock_quantity: number; product: unknown }>;
  if (variants.length === 0) throw new NotFoundError("No matching variants");

  const variantMap = new Map<string, Record<string, unknown> & { id: string; sku: string; stock_quantity: number; product: unknown }>(
    variants.map((v) => [v.id, v]),
  );

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

  // Fetch 24h cached FX rates (Frankfurter live ECB rates + fallback)
  const { rates } = await getExchangeRates();

  const items: PricedCartItem[] = [];
  let subtotal = 0;

  for (const cartItem of opts.cart) {
    const v = variantMap.get(cartItem.variant_id);
    if (!v) throw new NotFoundError(`Variant ${cartItem.variant_id} not found`);
    const product = Array.isArray(v.product) ? v.product[0] : v.product;
    if (!product || !product.is_active) {
      throw new ConflictError(`Product for variant ${cartItem.variant_id} is not available`);
    }

    // Base currency is GBP
    const baseGbp = Number(
      (v as Record<string, unknown>).price_override_gbp ??
      (product as Record<string, unknown>).base_price_gbp ??
      (v as Record<string, unknown>).price_override_usd ??
      (product as Record<string, unknown>).base_price_usd ?? 0
    );

    let unitPrice = 0;
    if (opts.currency === "GBP") {
      unitPrice = roundPrice(baseGbp, "GBP");
    } else {
      // 1. Priority 1: Check for intentional manual price override in target currency
      const manualOverride = (v as Record<string, unknown>)[variantOverrideCol] as number | null | undefined;
      if (manualOverride != null && Number(manualOverride) > 0) {
        unitPrice = roundPrice(Number(manualOverride), opts.currency);
      } else {
        // 2. Priority 2 & 3: Live FX (Frankfurter) -> last saved -> fallback rate
        unitPrice = convertGbpPrice(baseGbp, opts.currency, rates);
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

    const lineTotal = roundPrice(unitPrice * cartItem.quantity, opts.currency);
    subtotal += lineTotal;

    items.push({
      variantId: v.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantSku: v.sku,
      options: optionsByVariant.get(v.id) ?? [],
      primaryImage: formatEmailImageUrl(primary?.url) ?? primary?.url ?? null,
      unitPrice,
      quantity: cartItem.quantity,
      lineTotal,
      stockAvailable: v.stock_quantity,
      inStock: v.stock_quantity > 0,
    });
  }

  const tax = await calculateTax(opts.country, opts.state);
  const taxAmount = tax.isInclusive
    ? roundPrice(subtotal - subtotal / (1 + tax.rate), opts.currency) // back-out the tax that is already inside the price
    : roundPrice(subtotal * tax.rate, opts.currency);

  return {
    items,
    subtotal: roundPrice(subtotal, opts.currency),
    tax: { rate: tax.rate, amount: taxAmount, isInclusive: tax.isInclusive },
    currency: opts.currency,
    country: opts.country,
    state: opts.state,
  };
}
