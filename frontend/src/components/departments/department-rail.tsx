"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { usePagedTrack } from "@/lib/hooks/use-paged-track";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export interface DepartmentRailTab {
  label: string;
  products: Product[];
  ctaHref?: string;
}

interface DepartmentRailProps {
  title: string;
  products: Product[];
  brandNames: Record<string, string>;
  ctaHref?: string;
  tabs?: DepartmentRailTab[];
}

/**
 * Horizontal product carousel used across department pages — supporting
 * interactive curated tabs (New, Bestseller, Letty’s Favourite) or a single title.
 */
export function DepartmentRail({ title, products, brandNames, ctaHref, tabs }: DepartmentRailProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { trackRef, page, pages, onScroll, scrollByPage } = usePagedTrack();

  const hasTabs = Boolean(tabs && tabs.length > 0);
  const activeTab = hasTabs && tabs ? tabs[activeTabIndex] : null;
  const currentProducts = activeTab ? activeTab.products : products;
  const currentCtaHref = activeTab ? (activeTab.ctaHref ?? ctaHref) : ctaHref;

  if (currentProducts.length === 0 && (!tabs || tabs.every((t) => t.products.length === 0))) {
    return null;
  }

  const displayProducts = currentProducts.slice(0, 10);

  return (
    <section
      aria-label={activeTab ? activeTab.label : title}
      className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20"
    >
      <Reveal>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          {hasTabs && tabs ? (
            <div className="flex flex-wrap items-center gap-5 sm:gap-8 md:gap-10">
              {tabs.map((tab, idx) => {
                const isActive = activeTabIndex === idx;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setActiveTabIndex(idx);
                      if (trackRef.current) {
                        trackRef.current.scrollTo({ left: 0, behavior: "smooth" });
                      }
                    }}
                    className={cn(
                      "relative pb-2 font-serif text-2xl uppercase tracking-[0.16em] transition-colors duration-300 sm:text-3xl md:text-4xl",
                      isActive
                        ? "font-normal text-ink"
                        : "font-light text-stone/40 hover:text-stone"
                    )}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <h2 className="font-serif text-2xl font-normal uppercase tracking-luxe text-ink sm:text-3xl md:text-4xl">
              {title}
            </h2>
          )}

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {currentCtaHref && (
              <Link
                href={currentCtaHref}
                className="group mr-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-luxe-sm text-stone transition-colors hover:text-ink"
              >
                View all
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
            <span
              aria-hidden
              className="hidden text-xs font-medium tracking-luxe-sm text-stone tabular-nums md:inline"
            >
              {page} / {pages}
            </span>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={page <= 1}
              aria-label="Scroll products left"
              className="hidden h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone disabled:opacity-40 disabled:hover:border-line md:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={page >= pages}
              aria-label="Scroll products right"
              className="hidden h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone disabled:opacity-40 disabled:hover:border-line md:inline-flex"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </Reveal>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayProducts.map((product, i) => (
          <Reveal
            key={`${activeTabIndex}-${product.id}`}
            delay={0.04 * i}
            className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-[32vw] lg:w-[calc((100%-3.75rem)/4)]"
          >
            <ProductCard
              product={product}
              brandName={brandNames[product.brandSlug]}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
