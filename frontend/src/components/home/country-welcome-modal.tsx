"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { LogoImage } from "@/components/shared/logo";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { CountrySelect } from "@/components/ui/country-select";
import { ENTRANCE_STORAGE_KEY } from "@/components/home/entrance-reveal";
import { useHydrated } from "@/hooks/use-hydrated";

const DISMISSED_KEY = "letty-country-welcome-seen";

export function CountryWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();

  const selectedCountry = useCurrencyStore((s) => s.country);
  const hasChosenCountry = useCurrencyStore((s) => s.hasChosenCountry);
  const setCountry = useCurrencyStore((s) => s.setCountry);
  const setHasChosenCountry = useCurrencyStore((s) => s.setHasChosenCountry);

  const [tempCountry, setTempCountry] = useState<CountryInfo>(selectedCountry);

  useEffect(() => {
    if (!hydrated) return;

    // Check if user already dismissed or made a choice
    let seen = false;
    try {
      seen =
        hasChosenCountry ||
        localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      /* ignore */
    }

    if (seen) return;

    // Check if entrance curtain is playing
    let entranceSeen = false;
    try {
      entranceSeen = sessionStorage.getItem(ENTRANCE_STORAGE_KEY) === "1";
    } catch {
      /* ignore */
    }

    // Delay modal so the entrance reveal completes gracefully
    const delay = entranceSeen ? 800 : 3400;
    const timer = setTimeout(() => {
      setTempCountry(selectedCountry);
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [hydrated, hasChosenCountry, selectedCountry]);

  const handleConfirm = () => {
    setCountry(tempCountry.code);
    setHasChosenCountry(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setHasChosenCountry(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg border border-line bg-ivory p-7 sm:p-10 shadow-2xl text-center"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss country selection"
            className="absolute right-4 top-4 p-1.5 text-stone transition-colors hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Brand Logo */}
          <div className="mx-auto mb-5 flex justify-center">
            <LogoImage variant="light" className="h-14 sm:h-16 w-auto" />
          </div>

          <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">
            LETTY CONCIERGE · WELCOME
          </p>

          <h2 className="mt-2 font-serif text-2xl font-medium text-ink sm:text-3xl">
            Where are you shopping from?
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-stone sm:text-sm">
            Please confirm your delivery destination to ensure bespoke pricing in your
            preferred currency, verified regional shipping routes, and accurate duties.
          </p>

          {/* Country Selection Dropdown */}
          <div className="mt-7 text-left">
            <CountrySelect
              id="welcome-country-select"
              label="Delivery Country & Currency"
              value={tempCountry.code}
              onChange={(c) => setTempCountry(c)}
            />
          </div>

          {/* Live Preview of Selected Currency */}
          <div className="mt-4 rounded border border-line/70 bg-[#EFE8DE]/60 p-3 text-left flex items-center justify-between text-xs">
            <span className="text-stone">Active Shopping Currency:</span>
            <span className="font-medium text-ink font-mono">
              {tempCountry.currency} ({tempCountry.currencySymbol})
            </span>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-ink text-xs font-medium uppercase tracking-luxe text-ivory transition-transform duration-200 hover:bg-ink/90 active:scale-[0.99]"
          >
            <span>Continue to Boutique</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
