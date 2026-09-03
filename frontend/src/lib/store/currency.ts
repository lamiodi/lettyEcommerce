"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  EXCHANGE_RATES,
  ZERO_DECIMAL_CURRENCIES,
  type CountryInfo,
  type CurrencyCode,
} from "@/lib/data/countries";

interface CurrencyState {
  country: CountryInfo;
  currency: CurrencyCode;
  hasChosenCountry: boolean;
  setCountry: (countryCodeOrName: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setHasChosenCountry: (chosen: boolean) => void;
  convertPrice: (gbpAmount: number, targetCurrency?: CurrencyCode) => number;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      country: DEFAULT_COUNTRY,
      currency: DEFAULT_COUNTRY.currency,
      hasChosenCountry: false,

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
        const activeCurrency = targetCurrency ?? get().currency;
        const rate = EXCHANGE_RATES[activeCurrency] ?? 1.0;
        const converted = gbpAmount * rate;

        // Zero-decimal currencies are rounded to the nearest whole integer
        if (ZERO_DECIMAL_CURRENCIES.includes(activeCurrency)) {
          return Math.round(converted);
        }

        // Standard 2-decimal currencies
        return Math.round(converted * 100) / 100;
      },
    }),
    {
      name: "letty-currency-preference",
      // Only persist specific keys to keep storage lean
      partialize: (state) => ({
        country: state.country,
        currency: state.currency,
        hasChosenCountry: state.hasChosenCountry,
      }),
    },
  ),
);
