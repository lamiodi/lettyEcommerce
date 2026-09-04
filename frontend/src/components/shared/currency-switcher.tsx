"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { useCurrencyStore } from "@/lib/store/currency";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface CurrencySwitcherProps {
  variant?: "header" | "footer";
  className?: string;
}

export function CurrencySwitcher({
  variant = "header",
  className,
}: CurrencySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  const selectedCountry = useCurrencyStore((s) => s.country);
  const selectedCurrency = useCurrencyStore((s) => s.currency);
  const setCountry = useCurrencyStore((s) => s.setCountry);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (c: CountryInfo) => {
    setCountry(c.code);
    setIsOpen(false);
  };

  if (!hydrated) {
    // SSR placeholder to avoid layout shift
    return (
      <div className={cn("flex items-center justify-center gap-1.5 text-xs text-stone/80 text-center", className)}>
        <span className="font-medium tracking-tight text-[11px]">GBP (£)</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative inline-flex justify-center", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "group flex items-center gap-2 text-xs transition-colors duration-200",
          variant === "header"
            ? "py-1 px-1.5 text-ink hover:text-stone"
            : "w-full justify-center border border-line bg-ivory px-4 py-2 text-[11px] uppercase tracking-luxe text-ink hover:border-ink shadow-xs text-center",
          isOpen && "text-ink",
        )}
      >
        {variant !== "header" && (
          <span className="text-base leading-none shrink-0" aria-hidden="true">
            {selectedCountry?.flag ?? "🇬🇧"}
          </span>
        )}
        <span className="font-medium tracking-tight whitespace-nowrap">
          {selectedCurrency} ({selectedCountry?.currencySymbol ?? "£"})
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-stone transition-transform duration-200 group-hover:text-ink shrink-0",
            isOpen && "rotate-180 text-ink",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 w-72 max-w-[calc(100vw-2.5rem)] border border-line bg-ivory p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150",
            variant === "header"
              ? "right-0"
              : "bottom-full mb-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0",
          )}
        >
          <div className="px-2.5 py-1.5 border-b border-line/60 mb-1">
            <p className="text-[10px] uppercase tracking-luxe text-stone">
              Select Shipping Region & Currency
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {COUNTRIES.map((c) => {
              const isSelected = c.code === selectedCountry?.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors",
                    "hover:bg-[#E5DCD0]/60",
                    isSelected && "bg-[#E5DCD0]/90 font-medium text-ink",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base leading-none" aria-hidden="true">
                      {c.flag}
                    </span>
                    <span className="truncate text-ink">{c.name}</span>
                  </span>

                  <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-stone">
                      {c.currency} ({c.currencySymbol})
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-ink" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
