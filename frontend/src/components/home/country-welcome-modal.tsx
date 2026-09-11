"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Globe, X } from "lucide-react";
import { toast } from "sonner";
import { LogoImage } from "@/components/shared/logo";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { CountrySelect } from "@/components/ui/country-select";
import { CountryFlag } from "@/components/ui/country-flag";
import { ENTRANCE_STORAGE_KEY } from "@/components/home/entrance-reveal";
import { useHydrated } from "@/hooks/use-hydrated";

const DISMISSED_KEY = "letty-country-popup-dismissed-session";

export function CountryWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();

  const selectedCountry = useCurrencyStore((s) => s.country);
  const setCountry = useCurrencyStore((s) => s.setCountry);
  const setHasChosenCountry = useCurrencyStore((s) => s.setHasChosenCountry);

  const [tempCountry, setTempCountry] = useState<CountryInfo>(selectedCountry);

  useEffect(() => {
    if (selectedCountry) {
      setTempCountry(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (!hydrated) return;

    // Check if user already confirmed or dismissed in this session
    let seen = false;
    try {
      seen = sessionStorage.getItem(DISMISSED_KEY) === "1";
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

    // Delay modal so the entrance reveal completes gracefully and smoothly
    const delay = entranceSeen ? 700 : 2500;
    const timer = setTimeout(() => {
      setTempCountry(selectedCountry);
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [hydrated, selectedCountry]);

  const handleConfirm = () => {
    setCountry(tempCountry.code);
    setHasChosenCountry(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsOpen(false);
    toast.success(`Shipping destination set to ${tempCountry.name}`, {
      description: `Prices and checkout currency updated to ${tempCountry.currency} (${tempCountry.currencySymbol}).`,
    });
  };

  const handleDismiss = () => {
    setHasChosenCountry(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl md:max-w-2xl border border-line bg-ivory shadow-2xl overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss country selection"
            className="absolute right-3.5 top-3.5 z-20 p-2 text-stone/80 transition-colors hover:text-ink hover:bg-white/50 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Minimalist Editorial Image - Left Column on Desktop */}
            <div className="relative hidden md:block md:w-5/12 bg-[#231F1D] shrink-0 overflow-hidden">
              <Image
                src="/ima/IMG_6090.JPG.jpeg"
                alt="LETTY Global Atelier"
                fill
                sizes="380px"
                className="object-cover object-center transition-transform duration-1000 ease-out hover:scale-105"
                priority
              />
              {/* Soft luxury scrim overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium tracking-[0.22em] uppercase text-ivory/90 bg-black/40 backdrop-blur-xs border border-white/10">
                  <Globe className="h-3 w-3 text-gold" />
                  Worldwide Concierge
                </span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-ivory">
                <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-ivory/70">
                  LETTY ATELIER
                </p>
                <p className="mt-1 font-serif text-base font-normal tracking-wide text-ivory/95 leading-snug">
                  Bespoke Beauty for Every Complexion.
                </p>
                <p className="mt-1 text-[11px] text-ivory/70">
                  Complimentary tracked courier dispatch on qualified orders.
                </p>
              </div>
            </div>

            {/* Mobile Header Banner */}
            <div className="relative h-36 w-full overflow-hidden block md:hidden bg-[#231F1D] shrink-0">
              <Image
                src="/ima/IMG_6090.JPG.jpeg"
                alt="LETTY Global Atelier"
                fill
                sizes="100vw"
                className="object-cover object-top"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ivory via-transparent to-black/30" />
              <div className="absolute top-3 left-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-medium tracking-[0.2em] uppercase text-ivory/90 bg-black/50 backdrop-blur-xs border border-white/10">
                  <Globe className="h-2.5 w-2.5 text-gold" />
                  Global Concierge
                </span>
              </div>
            </div>

            {/* Content Area - Minimalist Quiet Luxury */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between text-left">
              <div>
                {/* Brand Logo & Eyebrow */}
                <div className="flex items-center justify-between mb-4">
                  <LogoImage variant="light" className="h-7 w-auto" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-stone/80">
                    EST. 2026
                  </span>
                </div>

                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone">
                  SELECT SHOPPING DESTINATION
                </p>

                <h2 className="mt-1.5 font-serif text-2xl font-medium text-ink tracking-tight">
                  Where are you shopping from?
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone/90">
                  Please select your delivery destination to ensure bespoke pricing in your local currency, verified tracked regional couriers, and exact duties.
                </p>

                {/* Country Select with Prominent Flag */}
                <div className="mt-5">
                  <CountrySelect
                    id="welcome-country-select"
                    label="Delivery Country & Currency"
                    variant="box"
                    value={tempCountry.code}
                    onChange={(c) => setTempCountry(c)}
                  />
                </div>

                {/* Minimalist Live Verified Destination Strip */}
                <div className="mt-3.5 flex items-center justify-between border border-line/90 bg-white/70 px-3.5 py-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <CountryFlag
                      code={tempCountry.code}
                      name={tempCountry.name}
                      flagFallback={tempCountry.flag}
                      size="lg"
                    />
                    <div className="truncate">
                      <p className="font-medium text-ink truncate text-xs">
                        {tempCountry.name}
                      </p>
                      <p className="text-[11px] text-stone truncate">
                        Shopping in <span className="font-mono font-medium text-ink">{tempCountry.currency} ({tempCountry.currencySymbol})</span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded border border-line bg-secondary px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone shrink-0 ml-2">
                    {tempCountry.code}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-2 border-t border-line/60">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex h-11 w-full items-center justify-center gap-2 bg-ink text-xs font-medium uppercase tracking-luxe text-ivory transition-all duration-200 hover:bg-ink/90 active:scale-[0.99] shadow-xs cursor-pointer"
                >
                  <CountryFlag
                    code={tempCountry.code}
                    name={tempCountry.name}
                    flagFallback={tempCountry.flag}
                    size="sm"
                  />
                  <span>Confirm &amp; Shop {tempCountry.currency}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </button>

                <div className="mt-2.5 text-center">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-stone hover:text-ink transition-colors cursor-pointer"
                  >
                    <span>Continue with default ({selectedCountry.name}</span>
                    <CountryFlag
                      code={selectedCountry.code}
                      name={selectedCountry.name}
                      flagFallback={selectedCountry.flag}
                      size="xs"
                    />
                    <span>)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
