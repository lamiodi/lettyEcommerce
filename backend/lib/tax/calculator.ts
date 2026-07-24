/**
 * Tax calculator.
 *   - Inclusive: tax is already baked into the displayed price.
 *   - Exclusive: tax is added on top.
 * Returns the effective tax rate (0..1) so callers can compute the tax amount.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export interface TaxRule {
  rate: number; // 0..1
  isInclusive: boolean;
}

export async function calculateTax(country: string, state?: string | null): Promise<TaxRule> {
  const cacheKey = `tax:${country.toUpperCase()}:${(state ?? "").toLowerCase()}`;
  const cached = await cacheGet<TaxRule>(cacheKey);
  if (cached) return cached;

  // Try state-level first, then country-level, then 0
  let query = supabaseAdmin()
    .from("tax_rules")
    .select("rate, is_inclusive")
    .eq("country", country.toUpperCase());
  if (state) query = query.eq("state", state).limit(1);
  else query = query.is("state", null).limit(1);
  let { data } = await query.maybeSingle();

  if (!data) {
    // Fallback to country-only (any state)
    const { data: countryData } = await supabaseAdmin()
      .from("tax_rules")
      .select("rate, is_inclusive")
      .eq("country", country.toUpperCase())
      .is("state", null)
      .limit(1)
      .maybeSingle();
    data = countryData;
  }

  const rule: TaxRule = data
    ? { rate: Number(data.rate) / 100, isInclusive: Boolean(data.is_inclusive) }
    : { rate: 0, isInclusive: true };

  await cacheSet(cacheKey, rule, 600);
  return rule;
}
