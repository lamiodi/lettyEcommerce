"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LettyImage } from "@/components/shared/letty-image";
import { Price } from "@/components/shared/price";
import { products } from "@/lib/mock/products";
import { useHydrated } from "@/hooks/use-hydrated";
import { motion } from "framer-motion";

const POPULAR = ["Silk", "Parfum", "Vitamin C", "Cashmere", "Lipstick", "Blazer"];
const RECENT_KEY = "letty_recent_searches";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable or blocked
    }
  }, [open]);

  const saveSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
      setRecentSearches([]);
    } catch {
      // Fallback
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categorySlug.includes(q) ||
          p.brandSlug.replaceAll("-", " ").includes(q),
      )
      .slice(0, 5);
  }, [query]);

  const go = (href: string, termToSave?: string) => {
    if (termToSave || query.trim()) {
      saveSearch(termToSave || query.trim());
    }
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  if (!hydrated) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-2xl rounded-xl border-line bg-ivory p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-line px-6 py-4">
          <DialogTitle className="sr-only">Search LETTY</DialogTitle>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-stone" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  go(`/search?q=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search products, collections, rituals..."
              className="h-9 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              aria-label="Search products"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {query.trim().length < 2 ? (
            <div className="space-y-5">
              {recentSearches.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">
                      Recent Searches
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] uppercase tracking-luxe text-stone hover:text-ink transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-xs text-ink transition-all hover:border-ink hover:text-ink active:scale-95"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-luxe text-stone">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-ink transition-all hover:border-gold hover:text-gold active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (

            <p className="py-8 text-center text-sm text-stone">
              No pieces found for &ldquo;{query}&rdquo;. Try searching another formulation, scent or piece.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((p, index) => (
                <motion.li
                  key={p.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => go(`/products/${p.slug}`, p.name)}
                    className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-surface/60 active:opacity-80"
                  >
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md">
                      <LettyImage imageKey={p.media[0].imageKey} sizes="56px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-base text-ink">
                         {p.name}
                      </span>
                      <span className="block text-xs uppercase tracking-luxe-sm text-stone">
                        {p.categorySlug}
                      </span>
                    </span>
                    <Price price={p.basePriceUsd} className="text-sm" />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && results.length > 0 && (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
              className="mt-4 w-full rounded-lg border border-ink py-2.5 text-sm font-medium text-ink transition-all hover:bg-ink hover:text-ivory active:scale-[0.98]"
            >
              View All Results
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
