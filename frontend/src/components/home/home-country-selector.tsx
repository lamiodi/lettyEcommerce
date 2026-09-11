"use client";

import { useState } from "react";
import { Globe, ChevronDown, Check, ArrowRight, X, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { useHydrated } from "@/hooks/use-hydrated";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

const POPULAR_COUNTRY_CODES = ["GB", "US", "CA", "FR", "DE", "NG", "ZA", "AE"];

export function HomeCountrySelector() {
  const hydrated = useHydrated();
  const currentCountry = useCurrencyStore((s) => s.country);
  const currentCurrency = useCurrencyStore((s) => s.currency);
  const setCountry = useCurrencyStore((s) => s.setCountry);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeCountry = hydrated && currentCountry ? currentCountry : COUNTRIES[0];
  const activeCurrency = hydrated && currentCurrency ? currentCurrency : "GBP";

  const handleSelectCountry = (country: CountryInfo) => {
    setCountry(country.code);
    setIsOpen(false);
    toast.success(
      `Delivery set to ${country.name}`,
      {
        description: `Prices and checkout currency updated to ${country.currency} (${country.currencySymbol}).`,
      }
    );
  };

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  const popularCountries = COUNTRIES.filter((c) => POPULAR_COUNTRY_CODES.includes(c.code));

  return (
    <>
      {/* Top Banner / Selector Strip on Homepage */}
      <section
        aria-label="Destination and currency selector"
        className="w-full border-b border-line/60 bg-[#FAF7F2] text-ink transition-colors"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-8">
          <div className="flex items-center gap-2 text-stone">
            <Globe className="h-3.5 w-3.5 text-gold shrink-0" aria-hidden />
            <span className="hidden sm:inline text-[11px] uppercase tracking-luxe">
              Worldwide Concierge &amp; Dispatch
            </span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="text-[11px] text-ink font-medium">
              Shipping to{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <CountryFlag
                  code={activeCountry.code}
                  name={activeCountry.name}
                  flagFallback={activeCountry.flag}
                  size="xs"
                />
                {activeCountry.name}
              </span>
            </span>
            <span className="text-stone text-[11px]">
              ({activeCurrency} · {activeCountry.currencySymbol})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={`Current shipping destination is ${activeCountry.name}. Click to change country and currency.`}
              className="group inline-flex items-center gap-1.5 rounded-none border border-line bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-luxe text-ink shadow-2xs transition-all hover:border-ink hover:bg-ivory active:scale-98 cursor-pointer"
            >
              <span>Change Region</span>
              <ChevronDown className="h-3 w-3 text-stone transition-transform duration-200 group-hover:text-ink" />
            </button>
          </div>
        </div>
      </section>

      {/* Country Selection Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-ink/65 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="country-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg border border-line bg-ivory shadow-2xl overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line bg-[#FAF7F2] p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone">
                    <Sparkles className="h-3 w-3 text-gold" />
                    <span>Global Atelier Settings</span>
                  </div>
                  <h2
                    id="country-modal-title"
                    className="mt-0.5 font-serif text-xl sm:text-2xl font-medium text-ink tracking-tight"
                  >
                    Select Your Country
                  </h2>
                  <p className="mt-1 text-[11px] text-stone">
                    Currency, regional couriers, and checkout details will automatically adjust.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close country selection"
                  className="rounded-full p-2 text-stone hover:bg-white/80 hover:text-ink transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="border-b border-line bg-white p-3 sm:px-5 sm:py-3">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-stone/80" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by country, currency, or dial code..."
                    className="h-10 w-full rounded-none border border-line bg-ivory/50 pl-9 pr-8 text-xs text-ink placeholder:text-stone/60 transition-colors focus:border-ink focus:bg-white focus:outline-none focus:ring-1 focus:ring-ink"
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 p-1 text-stone hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Select Popular Destinations */}
              {!search && (
                <div className="border-b border-line bg-[#FAF7F2]/60 px-4 py-3 sm:px-5">
                  <p className="text-[10px] uppercase tracking-luxe text-stone mb-2">
                    Popular Destinations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {popularCountries.map((c) => {
                      const isSelected = c.code === activeCountry.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className={cn(
                            "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-all cursor-pointer",
                            isSelected
                              ? "border-ink bg-ink text-ivory font-medium shadow-xs"
                              : "border-line bg-white text-ink hover:border-ink hover:bg-ivory"
                          )}
                        >
                          <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="xs" />
                          <span>{c.name}</span>
                          <span className={cn("text-[10px] font-mono", isSelected ? "text-ivory/80" : "text-stone")}>
                            {c.currency}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Country List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-line/40 bg-ivory p-1 sm:p-2">
                {filteredCountries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone">
                    No country matches &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.code === activeCountry.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={cn(
                          "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer",
                          "hover:bg-[#E5DCD0]/60",
                          isSelected && "bg-[#E5DCD0]/80 font-medium text-ink"
                        )}
                      >
                        <span className="flex items-center gap-3 truncate">
                          <CountryFlag code={c.code} name={c.name} flagFallback={c.flag} size="md" />
                          <span className="truncate text-ink font-medium">{c.name}</span>
                          <span className="text-[11px] font-mono text-stone">{c.dialCode}</span>
                        </span>

                        <span className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="rounded border border-line/60 bg-white/70 px-2 py-0.5 text-[10px] font-mono text-ink">
                            {c.currency} ({c.currencySymbol})
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-ink" />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Note */}
              <div className="flex items-center justify-between border-t border-line bg-[#FAF7F2] px-4 py-3 sm:px-5">
                <div className="text-[11px] text-stone">
                  Instant currency conversion · Frictionless checkout
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-luxe text-ink hover:underline cursor-pointer"
                >
                  <span>Close</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
