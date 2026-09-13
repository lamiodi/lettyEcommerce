"use client";

import { useEffect, useRef, useState, useId } from "react";
import { MapPin, Loader2, Sparkles, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AddressSuggestionItem } from "@/app/api/address/suggest/route";

export interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion: (suggestion: AddressSuggestionItem) => void;
  country?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  autoComplete?: string;
}

export function AddressAutocomplete({
  id = "address",
  name,
  value,
  onChange,
  onSelectSuggestion,
  country = "United Kingdom",
  placeholder = "Address",
  error,
  className,
  autoComplete = "address-line1",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownId = useId();

  // Fetch address suggestions debounced
  useEffect(() => {
    if (justSelected) {
      setJustSelected(false);
      return;
    }

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/address/suggest?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`
        );
        if (res.ok) {
          const data = await res.json();
          const list: AddressSuggestionItem[] = Array.isArray(data.suggestions)
            ? data.suggestions
            : [];
          setSuggestions(list);
          setIsOpen(list.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, country, justSelected]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item: AddressSuggestionItem) => {
    setJustSelected(true);
    onChange(item.streetLine);
    onSelectSuggestion(item);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name || id}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? dropdownId : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-11 w-full rounded-[2px] border bg-white px-3.5 pr-10 text-sm text-ink placeholder:text-stone/40 transition-colors",
            "focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-stone/20",
            className
          )}
        />

        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone/50">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-stone" />
          ) : (
            <MapPin className="h-3.5 w-3.5 text-stone/40" />
          )}
        </div>
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-[10px] text-red-600 font-medium"
        >
          {error}
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id={dropdownId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-[2px] border border-line bg-white shadow-2xl divide-y divide-line/60 animate-in fade-in-50 slide-in-from-top-1 duration-150"
        >
          <div className="px-3 py-1.5 bg-surface/60 flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-stone border-b border-line/60">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-gold" />
              Suggested Addresses
            </span>
            <span>Tap to auto-fill</span>
          </div>

          {suggestions.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "w-full px-3.5 py-2.5 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer group",
                  isSelected
                    ? "bg-stone/10 text-ink"
                    : "hover:bg-surface text-ink/90"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <MapPin
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0 transition-colors",
                      isSelected ? "text-gold" : "text-stone/50 group-hover:text-gold"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink truncate leading-snug">
                      {item.streetLine}
                    </p>
                    <p className="text-[11px] text-stone truncate mt-0.5">
                      {[item.city, item.state, item.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-stone bg-secondary/80 rounded border border-line">
                  {item.countryCode || "INTL"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
