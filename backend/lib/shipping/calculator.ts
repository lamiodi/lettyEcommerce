/**
 * Shipping rate calculator.
 *
 * Strategy:
 *   1. Find a shipping zone whose `countries` JSONB array contains the destination.
 *   2. Pick the first active method in that zone, with optional free-over logic.
 *   3. Return the rate in the order's currency (uses the matching per-currency
 *      column on `shipping_methods`).
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { priceColumn } from "@/lib/utils/price-columns";
import type { Currency } from "@/lib/validations";
import { getExchangeRates, convertGbpPrice, roundPrice } from "@/lib/currency/fx";

export interface ShippingQuote {
  zoneId: string;
  methodId: string | null;
  methodName: string;
  estimatedDays?: string;
  rate: number;
  freeApplied: boolean;
}

export async function calculateShipping(opts: {
  country: string;
  subtotal: number;
  currency: Currency;
  preferredMethodId?: string;
}): Promise<ShippingQuote> {
  const cacheKey = `shipping:v2:${opts.country.toUpperCase()}:${opts.currency}:${opts.subtotal.toFixed(2)}:${opts.preferredMethodId ?? "any"}`;
  const cached = await cacheGet<ShippingQuote>(cacheKey);
  if (cached) return cached;

  const rateCol = priceColumn("rate", opts.currency);
  const freeCol = priceColumn("free_over", opts.currency);

  const EUROPE_COUNTRY_CODES = new Set([
    "FR", "DE", "IT", "ES", "NL", "BE", "IE", "CH", "AT", "SE",
    "NO", "DK", "FI", "PT", "GR", "PL", "CZ", "HU", "RO", "BG",
    "HR", "SK", "SI", "EE", "LV", "LT", "LU", "CY", "MT", "IS",
  ]);

  // Use 24-hour cached FX rates (Frankfurter live ECB rates + fallback)
  const { rates } = await getExchangeRates();

  const convertFromGbp = (gbpAmount: number, currency: string) => {
    return convertGbpPrice(gbpAmount, currency, rates);
  };

  const getDestinationRate = (countryCode: string, currency: string) => {
    const c = countryCode.toUpperCase();
    if (c === "GB" || c === "UK") {
      return {
        name: "UK Tracked Delivery",
        rate: convertFromGbp(4.99, currency),
        estimatedDays: "2-3 business days",
      };
    }
    if (EUROPE_COUNTRY_CODES.has(c)) {
      // The €15 Europe rate is already euro-denominated; other currencies
      // convert the GBP rate.
      const rate = currency === "EUR" ? 15.0 : convertFromGbp(12.82, currency);
      return { name: "Europe Tracked Delivery", rate, estimatedDays: "3-5 business days" };
    }
    if (c === "US" || c === "CA") {
      return {
        name: "North America Tracked Delivery",
        rate: convertFromGbp(25.0, currency),
        estimatedDays: "3-5 business days",
      };
    }
    return {
      name: "International Tracked Delivery",
      // The €30 Rest of World rate is euro-denominated; other currencies
      // convert the GBP rate.
      rate: currency === "EUR" ? 30.0 : convertFromGbp(30.0, currency),
      estimatedDays: "5-7 business days",
    };
  };

  // Find the zone
  const { data: zones } = await supabaseAdmin()
    .from("shipping_zones")
    .select("id, name, countries")
    .eq("is_active", true);

  const countryUpper = opts.country.toUpperCase();
  const zone = (zones ?? []).find((z) => {
    const list = (z.countries as string[] | null) ?? [];
    return list.map((c) => c.toUpperCase()).includes(countryUpper);
  });

  // Pick a method (dynamic select for the per-currency rate + free-over cols)
  let methodQuery = zone
    ? supabaseAdmin()
        .from("shipping_methods")
        .select(`id, zone_id, name, estimated_days, position, is_active, ${rateCol}, ${freeCol}`)
        .eq("zone_id", zone.id)
        .eq("is_active", true)
        .order("position", { ascending: true })
    : null;
  const isUuid = (val?: string | null) =>
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  if (opts.preferredMethodId && methodQuery) {
    if (isUuid(opts.preferredMethodId)) {
      methodQuery = methodQuery.eq("id", opts.preferredMethodId);
    }
  }

  const { data: methods } = methodQuery ? await methodQuery.limit(1) : { data: null };
  const method = methods?.[0] as (Record<string, unknown> & { id: string; name: string; estimated_days: string | null }) | undefined;

  const destFallback = getDestinationRate(opts.country, opts.currency);

  const dbRate = Number(method?.[rateCol] ?? 0);
  const rate = dbRate > 0 ? dbRate : destFallback.rate;
  const freeOver = method?.[freeCol] as number | null | undefined;
  const freeThreshold = freeOver != null ? Number(freeOver) : convertFromGbp(150, opts.currency);
  const freeApplied = opts.subtotal >= freeThreshold;

  const quote: ShippingQuote = {
    zoneId: zone?.id ?? "temporary-flat-zone",
    methodId: method?.id ?? null,
    methodName: method?.name ?? destFallback.name,
    estimatedDays: method?.estimated_days ?? destFallback.estimatedDays,
    rate: freeApplied ? 0 : roundPrice(rate, opts.currency),
    freeApplied,
  };

  await cacheSet(cacheKey, quote, 300);
  return quote;
}
