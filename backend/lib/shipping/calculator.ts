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
import { ConflictError } from "@/lib/errors";
import { priceColumn } from "@/lib/utils/price-columns";
import type { Currency } from "@/lib/validations";

export interface ShippingQuote {
  zoneId: string;
  methodId: string;
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
  const cacheKey = `shipping:${opts.country}:${opts.currency}:${Math.floor(opts.subtotal / 100) * 100}:${opts.preferredMethodId ?? "any"}`;
  const cached = await cacheGet<ShippingQuote>(cacheKey);
  if (cached) return cached;

  const rateCol = priceColumn("rate", opts.currency);
  const freeCol = priceColumn("free_over", opts.currency);

  const EUROPE_COUNTRY_CODES = new Set([
    "FR", "DE", "IT", "ES", "NL", "BE", "IE", "CH", "AT", "SE",
    "NO", "DK", "FI", "PT", "GR", "PL", "CZ", "HU", "RO", "BG",
    "HR", "SK", "SI", "EE", "LV", "LT", "LU", "CY", "MT", "IS",
  ]);

  const getDestinationRate = (countryCode: string, currency: string) => {
    const c = countryCode.toUpperCase();
    if (c === "GB" || c === "UK") {
      return { name: "UK Tracked Delivery", rate: 4.99, estimatedDays: "2-3 business days" };
    }
    if (EUROPE_COUNTRY_CODES.has(c)) {
      const rate = currency === "EUR" ? 15.00 : 12.82;
      return { name: "Europe Tracked Delivery", rate, estimatedDays: "3-5 business days" };
    }
    if (c === "US" || c === "CA") {
      const rate = currency === "USD" ? 32.00 : 25.00;
      return { name: "North America Tracked Delivery", rate, estimatedDays: "3-5 business days" };
    }
    return { name: "International Tracked Delivery", rate: 30.00, estimatedDays: "5-7 business days" };
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
  if (opts.preferredMethodId && methodQuery) methodQuery = methodQuery.eq("id", opts.preferredMethodId);

  const { data: methods } = methodQuery ? await methodQuery.limit(1) : { data: null };
  const method = methods?.[0] as (Record<string, unknown> & { id: string; name: string; estimated_days: string | null }) | undefined;

  const destFallback = getDestinationRate(opts.country, opts.currency);

  const dbRate = Number(method?.[rateCol] ?? 0);
  const rate = dbRate > 0 ? dbRate : destFallback.rate;
  const freeOver = method?.[freeCol] as number | null | undefined;
  const freeApplied = (freeOver != null && opts.subtotal >= Number(freeOver)) || opts.subtotal >= 150;

  const quote: ShippingQuote = {
    zoneId: zone?.id ?? "temporary-flat-zone",
    methodId: method?.id ?? "standard",
    methodName: method?.name ?? destFallback.name,
    estimatedDays: method?.estimated_days ?? destFallback.estimatedDays,
    rate: freeApplied ? 0 : rate,
    freeApplied,
  };

  await cacheSet(cacheKey, quote, 300);
  return quote;
}
