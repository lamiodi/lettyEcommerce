"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  EXCHANGE_RATES,
  STRIPE_CHARGEABLE_CURRENCIES,
  type CountryInfo,
  type CurrencyCode,
} from "@/lib/data/countries";

interface CurrencyState {
  country: CountryInfo;
  currency: CurrencyCode;
  hasChosenCountry: boolean;
  rates: Record<CurrencyCode, number>;
  ratesUpdatedAt: number | null;
  setCountry: (countryCodeOrName: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setHasChosenCountry: (chosen: boolean) => void;
  convertPrice: (gbpAmount: number, targetCurrency?: CurrencyCode) => number;
  fetchRates: (force?: boolean) => Promise<void>;
}

/**
 * Clean luxury retail rounding matching backend:
 * - NGN and KES round to whole integers (standard for Nigerian Naira & Kenyan Shillings).
 * - USD, EUR, CAD, GBP, ZAR, GHS round to 2 decimal places.
 */
function roundPrice(amount: number, currency: string): number {
  if (!Number.isFinite(amount)) return 0;
  const curr = currency.toUpperCase();
  if (curr === "NGN" || curr === "KES") {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      country: DEFAULT_COUNTRY,
      currency: DEFAULT_COUNTRY.currency,
      hasChosenCountry: false,
      rates: { ...EXCHANGE_RATES },
      ratesUpdatedAt: null,

      setCountry: (countryCodeOrName) => {
        const found =
          COUNTRIES.find(
            (c) =>
              c.code.toLowerCase() === countryCodeOrName.toLowerCase() ||
              c.name.toLowerCase() === countryCodeOrName.toLowerCase(),
          ) ?? DEFAULT_COUNTRY;
        set({
          country: found,
          currency: found.currency,
          hasChosenCountry: true,
        });
      },

      setCurrency: (currency) => set({ currency }),

      setHasChosenCountry: (hasChosenCountry) => set({ hasChosenCountry }),

      convertPrice: (gbpAmount: number, targetCurrency?: CurrencyCode) => {
        const safeAmount = Number.isFinite(gbpAmount) ? gbpAmount : 0;
        const activeCurrency = targetCurrency ?? get().currency;
        if (activeCurrency === "GBP") {
          return roundPrice(safeAmount, "GBP");
        }

        const stateRates = get().rates;
        const rate = stateRates?.[activeCurrency] ?? EXCHANGE_RATES[activeCurrency] ?? 1.0;
        const converted = safeAmount * rate;

        return roundPrice(converted, activeCurrency);
      },

      fetchRates: async (force = false) => {
        const now = Date.now();
        const lastFetched = get().ratesUpdatedAt;
        // Re-fetch exchange rates every 10 minutes if not forced
        if (!force && lastFetched && now - lastFetched < 10 * 60 * 1000) {
          return;
        }

        // 1. Try backend public exchange-rates endpoint first (authoritative with admin fixed FX)
        try {
          const url = force ? "/api/public/exchange-rates?force=true" : "/api/public/exchange-rates";
          const res = await fetch(url, {
            signal: AbortSignal.timeout(4000),
            cache: force ? "no-store" : "default",
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data?.rates) {
              set({
                rates: { ...EXCHANGE_RATES, ...json.data.rates, GBP: 1.0 },
                ratesUpdatedAt: now,
              });
              return;
            }
          }
        } catch {
          // Backend route not reachable from current domain, fallback to Frankfurter
        }

        // 2. Direct Frankfurter API fallback (CORS enabled, open, ECB official data)
        try {
          const res = await fetch("https://api.frankfurter.dev/v1/latest?base=GBP", {
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.rates) {
              const freshRates: Record<CurrencyCode, number> = {
                ...EXCHANGE_RATES,
                GBP: 1.0,
                USD: Number(json.rates.USD ?? EXCHANGE_RATES.USD),
                EUR: Number(json.rates.EUR ?? EXCHANGE_RATES.EUR),
                CAD: Number(json.rates.CAD ?? EXCHANGE_RATES.CAD),
                ZAR: Number(json.rates.ZAR ?? EXCHANGE_RATES.ZAR),
              };
              set({
                rates: freshRates,
                ratesUpdatedAt: now,
              });
              return;
            }
          }
        } catch {
          // FX API unreachable
        }

        // 3. Fallback: if no valid rates are in state, initialize with hard-coded fallback rates
        if (!get().rates || Object.keys(get().rates).length === 0) {
          set({
            rates: { ...EXCHANGE_RATES },
            ratesUpdatedAt: now,
          });
        }
      },
    }),
    {
      name: "letty-currency-preference",
      // Persist country, currency, saved rates, and 24h timestamp
      partialize: (state) => ({
        country: state.country,
        currency: state.currency,
        hasChosenCountry: state.hasChosenCountry,
        rates: state.rates,
        ratesUpdatedAt: state.ratesUpdatedAt,
      }),
      // Older sessions persisted currencies Stripe cannot charge (ZAR/KES/
      // NGN/GHS from before those countries were remapped). Snap to the
      // stored country's current mapping so checkout stays payable.
      onRehydrateStorage: () => (state) => {
        if (state && !STRIPE_CHARGEABLE_CURRENCIES.has(state.currency)) {
          const remapped =
            COUNTRIES.find((c) => c.code === state.country.code) ?? DEFAULT_COUNTRY;
          state.country = remapped;
          state.currency = remapped.currency;
        }
      },
    },
  ),
);

// Auto-refresh rates in background on client mount if expired (>24h)
if (typeof window !== "undefined") {
  setTimeout(() => {
    useCurrencyStore.getState().fetchRates().catch(() => {});
  }, 100);
}
