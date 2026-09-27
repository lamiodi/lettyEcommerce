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
  source: "frankfurter" | "saved" | "fallback";
}

interface SavedCachePayload {
  base: "GBP";
  rates: Record<string, number>;
  timestamp: number;
  source: "frankfurter" | "saved" | "fallback";
}

let memoryCache: SavedCachePayload | null = null;

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
    // Non-fatal if running in a read-only or restricted filesystem
    logger.warn({ err }, "Could not persist FX rates to disk");
  }
}

/**
 * Returns latest FX rates relative to GBP (£1.00 base).
 * Refreshes from Frankfurter once every 24 hours.
 */
export async function getExchangeRates(forceRefresh = false): Promise<FxRateResult> {
  const now = Date.now();

  // 1. Check in-memory cache if not expired
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      base: "GBP",
      rates: memoryCache.rates,
      updatedAt: new Date(memoryCache.timestamp).toISOString(),
      source: memoryCache.source,
    };
  }

  // 2. Check disk cache if in-memory was empty and not expired
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

  // 3. Fetch fresh rates from Frankfurter API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(FRANKFURTER_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // Hint for Next.js fetch cache
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Frankfurter API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.rates || typeof data.rates !== "object") {
      throw new Error("Invalid response format from Frankfurter API");
    }

    // Merge: start with fallback rates (so African currencies NGN/GHS/KES are preserved),
    // then overwrite with fresh ECB rates, guaranteeing GBP = 1.0.
    const mergedRates: Record<string, number> = {
      ...FALLBACK_RATES,
      GBP: 1.0,
    };

    for (const [curr, rate] of Object.entries(data.rates)) {
      if (typeof rate === "number" && rate > 0) {
        mergedRates[curr.toUpperCase()] = rate;
      }
    }

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

    // Fallback 1: Use last saved rates from memory or disk (even if > 24 hours old)
    const saved = memoryCache ?? readSavedRates();
    if (saved && saved.rates && Object.keys(saved.rates).length > 0) {
      return {
        base: "GBP",
        rates: saved.rates,
        updatedAt: new Date(saved.timestamp).toISOString(),
        source: "saved",
      };
    }

    // Fallback 2: Use hard-coded fallback rates
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
