"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES, type CountryInfo } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string; // Country name or code
  onChange: (country: CountryInfo) => void;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  className,
  label,
  required,
  disabled,
  id: customId,
}: CountrySelectProps) {
  const generatedId = useId();
  const id = customId ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Match active country by name or code
  const selectedCountry = useMemo(() => {
    return (
      COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === value.toLowerCase() ||
          c.code.toLowerCase() === value.toLowerCase(),
      ) ?? COUNTRIES[0]
    );
  }, [value]);

  // Click outside listener to dismiss
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

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q) ||
        c.dialCode.includes(q),
    );
  }, [search]);

  const handleSelect = (country: CountryInfo) => {
    onChange(country);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[11px] font-medium uppercase tracking-luxe text-stone"
        >
          {label} {required && "*"}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "group flex h-11 w-full items-center justify-between border-b border-line bg-transparent px-0 text-left text-sm transition-colors",
          "hover:border-ink focus:border-ink focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "border-ink",
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-xl leading-none" aria-hidden="true">
            {selectedCountry.flag}
          </span>
          <span className="truncate font-medium text-ink">
            {selectedCountry.name}
          </span>
          <span className="text-xs text-stone">
            ({selectedCountry.currency} · {selectedCountry.currencySymbol})
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-stone transition-transform duration-200 group-hover:text-ink",
            isOpen && "rotate-180 text-ink",
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] rounded-none border border-line bg-ivory shadow-xl animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Search Header */}
          <div className="flex items-center border-b border-line px-3 py-2 bg-ivory">
            <Search className="mr-2 h-4 w-4 text-stone flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or currency..."
              className="w-full bg-transparent text-xs text-ink placeholder:text-stone/70 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-1 text-stone hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List Options */}
          <div className="max-h-64 overflow-y-auto divide-y divide-line/40">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-stone">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors",
                      "hover:bg-[#E5DCD0]/60",
                      isSelected && "bg-[#E5DCD0]/80 font-medium text-ink",
                    )}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className="text-lg leading-none" aria-hidden="true">
                        {c.flag}
                      </span>
                      <span className="truncate text-ink">{c.name}</span>
                    </span>

                    <span className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="rounded border border-line/60 bg-white/40 px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-tight text-stone">
                        {c.currency} ({c.currencySymbol})
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-ink" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-line/60 bg-[#EFE8DE]/80 px-3.5 py-2 text-[10px] text-stone flex items-center justify-between">
            <span>Prices & payment gateway auto-adjust</span>
            <span className="font-mono">{COUNTRIES.length} regions</span>
          </div>
        </div>
      )}
    </div>
  );
}
