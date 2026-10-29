/**
 * FX rate manager & currency price converter.
 *
 * Requirements:
 *  - GBP stays as the database/base currency.
 *  - Live exchange rates fetched from Frankfurter API (ECB official data) once every 24 hours.
 *  - Rates saved locally (in-memory + disk cache) without requiring Redis.
 *  - If the FX API fails, use the last saved rates.
 *  - If no saved rates exist, use hard-coded fallback rates.
 *  - Nice rounding for retail (clean integers for NGN/KES, 2 decimals for USD/EUR/CAD/GBP/ZAR/GHS).
 *  - Supports priority: manual currency price -> live FX -> fallback rate.
 */
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/server";

export const FALLBACK_RATES: Record<string, number> = {
  GBP: 1.0,
  USD: 1.28,
  EUR: 1.17,
  CAD: 1.74,
  NGN: 2050.0,
  GHS: 19.5,
  ZAR: 23.5,
  KES: 165.0,
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?base=GBP";
const CACHE_FILE_PATH = path.join(process.cwd(), ".cache", "fx-rates.json");

export interface FxRateResult {
  base: "GBP";
  rates: Record<string, number>;
  updatedAt: string;
  source: "admin_fixed" | "frankfurter" | "saved" | "fallback";
}

interface SavedCachePayload {
  base: "GBP";
  rates: Record<string, number>;
  timestamp: number;
  source: "admin_fixed" | "frankfurter" | "saved" | "fallback";
}

let memoryCache: SavedCachePayload | null = null;

export function invalidateFxCache(): void {
  memoryCache = null;
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      fs.unlinkSync(CACHE_FILE_PATH);
    }
  } catch (err) {
    logger.warn({ err }, "Could not unlink FX disk cache file");
  }
}

export async function fetchLiveMarketRates(): Promise<Record<string, number>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(FRANKFURTER_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Frankfurter returned HTTP ${res.status}`);
    const data = await res.json();
    const live: Record<string, number> = {
      ...FALLBACK_RATES,
      GBP: 1.0,
    };
    if (data && data.rates && typeof data.rates === "object") {
      for (const [c, r] of Object.entries(data.rates)) {
        if (typeof r === "number" && r > 0) {
          live[c.toUpperCase()] = r;
        }
      }
    }
    return live;
  } catch (err) {
    clearTimeout(timeoutId);
    logger.warn({ err }, "Failed to fetch live market rates from Frankfurter");
    return { ...FALLBACK_RATES };
  }
}

function readSavedRates(): SavedCachePayload | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.rates === "object" && typeof parsed.timestamp === "number") {
        return parsed as SavedCachePayload;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not read saved FX rates from disk");
  }
  return null;
}

function saveRatesToDisk(payload: SavedCachePayload): void {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    logger.warn({ err }, "Could not persist FX rates to disk");
  }
}

/**
 * Returns latest FX rates relative to GBP (£1.00 base).
 * Priority:
 *  1. Admin-configured Fixed FX rates (from `app_settings` where key = 'fx_rates' and mode = 'fixed').
 *  2. In-memory / disk cache if unexpired.
 *  3. Live rates from Frankfurter (ECB).
 *  4. Fallback rates.
 */
export async function getExchangeRates(forceRefresh = false): Promise<FxRateResult> {
  const now = Date.now();

  // 1. Fast path: check in-memory cache if unexpired and not forced
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < 15 * 60 * 1000) {
    return {
      base: "GBP",
      rates: memoryCache.rates,
      updatedAt: new Date(memoryCache.timestamp).toISOString(),
      source: memoryCache.source,
    };
  }

  // 2. Authoritative check: read admin settings from database
  try {
    const { data: settingRow } = await supabaseAdmin()
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "fx_rates")
      .maybeSingle();

    if (settingRow && settingRow.value) {
      const val = settingRow.value as {
        mode?: "fixed" | "live";
        rates?: Record<string, number>;
      };

      // If mode is 'fixed' (or rates object exists without mode='live'), use Admin Fixed Rates
      if (val.mode !== "live" && val.rates && typeof val.rates === "object") {
        const mergedRates: Record<string, number> = {
          ...FALLBACK_RATES,
          GBP: 1.0,
        };
        for (const [curr, rate] of Object.entries(val.rates)) {
          const num = Number(rate);
          if (Number.isFinite(num) && num > 0) {
            mergedRates[curr.toUpperCase()] = num;
          }
        }

        const payload: SavedCachePayload = {
          base: "GBP",
          rates: mergedRates,
          timestamp: now,
          source: "admin_fixed",
        };
        memoryCache = payload;
        saveRatesToDisk(payload);

        return {
          base: "GBP",
          rates: mergedRates,
          updatedAt: settingRow.updated_at || new Date(now).toISOString(),
          source: "admin_fixed",
        };
      }
    }
  } catch (dbErr) {
    logger.warn({ err: dbErr }, "Could not load fx_rates from app_settings; falling back to cache/live");
  }

  // 3. If not in fixed mode or DB load failed, check disk cache
  if (!forceRefresh && !memoryCache) {
    const saved = readSavedRates();
    if (saved && now - saved.timestamp < CACHE_TTL_MS) {
      memoryCache = saved;
      return {
        base: "GBP",
        rates: saved.rates,
        updatedAt: new Date(saved.timestamp).toISOString(),
        source: saved.source,
      };
    }
  }

  // 4. Fetch fresh rates from Frankfurter API
  try {
    const mergedRates = await fetchLiveMarketRates();

    const payload: SavedCachePayload = {
      base: "GBP",
      rates: mergedRates,
      timestamp: now,
      source: "frankfurter",
    };

    memoryCache = payload;
    saveRatesToDisk(payload);

    return {
      base: "GBP",
      rates: mergedRates,
      updatedAt: new Date(now).toISOString(),
      source: "frankfurter",
    };
  } catch (apiErr) {
    logger.warn({ err: apiErr }, "Frankfurter FX API request failed; attempting fallback");

    const saved = memoryCache ?? readSavedRates();
    if (saved && saved.rates && Object.keys(saved.rates).length > 0) {
      return {
        base: "GBP",
        rates: saved.rates,
        updatedAt: new Date(saved.timestamp).toISOString(),
        source: saved.source,
      };
    }

    return {
      base: "GBP",
      rates: { ...FALLBACK_RATES },
      updatedAt: new Date(now).toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Nicely round prices for consumer luxury display and checkout.
 * - NGN and KES round to whole integers (standard for Nigerian Naira & Kenyan Shillings).
 * - USD, EUR, CAD, GBP, ZAR, GHS round to 2 decimal places.
 */
export function roundPrice(amount: number, currency = "GBP"): number {
  if (!Number.isFinite(amount)) return 0;
  const curr = currency.toUpperCase();
  if (curr === "NGN" || curr === "KES") {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Converts a base GBP amount into the target currency using the provided or live exchange rates.
 * Follows clean luxury rounding for the target currency.
 */
export function convertGbpPrice(
  gbpAmount: number,
  targetCurrency: string,
  rates: Record<string, number>,
): number {
  const safeGbp = Number.isFinite(gbpAmount) ? gbpAmount : 0;
  const curr = targetCurrency.toUpperCase();
  if (curr === "GBP") return roundPrice(safeGbp, "GBP");
  const rate = rates[curr] ?? FALLBACK_RATES[curr] ?? 1.0;
  return roundPrice(safeGbp * rate, curr);
}
