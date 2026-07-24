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
  if (!zone) {
    throw new ConflictError(`No shipping zone configured for ${opts.country}`);
  }

  // Pick a method (dynamic select for the per-currency rate + free-over cols)
  let methodQuery = supabaseAdmin()
    .from("shipping_methods")
    .select(`id, zone_id, name, estimated_days, position, is_active, ${rateCol}, ${freeCol}`)
    .eq("zone_id", zone.id)
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (opts.preferredMethodId) methodQuery = methodQuery.eq("id", opts.preferredMethodId);

  const { data: methods, error } = await methodQuery.limit(1);
  if (error || !methods || methods.length === 0) {
    throw new ConflictError("No shipping methods available for this destination");
  }
  const method = methods[0] as Record<string, unknown> & { id: string; name: string; estimated_days: string | null };

  const rate = Number(method[rateCol] ?? 0);
  const freeOver = method[freeCol] as number | null | undefined;
  const freeApplied = freeOver != null && opts.subtotal >= Number(freeOver);

  const quote: ShippingQuote = {
    zoneId: zone.id,
    methodId: method.id,
    methodName: method.name,
    estimatedDays: method.estimated_days ?? undefined,
    rate: freeApplied ? 0 : rate,
    freeApplied,
  };

  await cacheSet(cacheKey, quote, 300);
  return quote;
}
