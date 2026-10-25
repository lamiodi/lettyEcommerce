"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
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
  /** Cards open a shade-picker modal instead of quick-adding (multi-shade products). */
  shadeSelect?: boolean;
}

/**
 * Horizontal product carousel used across department pages — supporting
 * interactive curated tabs (New, Bestseller, Letty’s Sets) or a single title.
 */
export function DepartmentRail({ title, products, brandNames, ctaHref, tabs, shadeSelect = false }: DepartmentRailProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { trackRef, page, pages, onScroll, scrollByPage } = usePagedTrack();

  const hasTabs = Boolean(tabs && tabs.length > 0);
  const activeTab = hasTabs && tabs ? tabs[activeTabIndex] : null;
  const currentProducts = activeTab ? activeTab.products : products;
  const currentCtaHref = activeTab ? (activeTab.ctaHref ?? ctaHref) : ctaHref;

  if (currentProducts.length === 0 && (!tabs || tabs.every((t) => t.products.length === 0))) {
    return (
      <section
        aria-label={title}
        className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20"
      >
        <div className="relative overflow-hidden border border-line bg-secondary/40 p-8 sm:p-12 md:p-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              COMING SOON
            </p>
            <h2 className="mt-3 font-serif text-2xl font-medium uppercase tracking-[0.14em] text-ink sm:text-3xl md:text-4xl">
              MORE TO DISCOVER
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-sm leading-relaxed text-stone md:text-base">
              There are no products in this edit yet. Explore the shop for LETTY products currently available.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/departments/makeup-beauty"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-ivory px-6 py-3.5 text-xs font-semibold uppercase tracking-luxe hover:bg-gold hover:text-ink transition-colors"
              >
                <span>Explore Beauty Rituals</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-ink/40 text-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-luxe hover:border-ink hover:bg-ink/5 transition-colors"
              >
                <span>Contact Customer Care</span>
              </Link>
            </div>
          </div>
      </section>
    );
  }

  const displayProducts = currentProducts.slice(0, 10);

  return (
    <section
      aria-label={activeTab ? activeTab.label : title}
      className="mx-auto max-w-7xl px-4 py-8 sm:py-10 md:px-8 md:py-16"
    >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          {hasTabs && tabs ? (
            <div className="flex flex-nowrap items-center gap-4 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:gap-6 md:gap-8">
              {tabs.map((tab, idx) => {
                const isActive = activeTabIndex === idx;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setActiveTabIndex(idx);
                      if (trackRef.current) {
                        trackRef.current.scrollTo({ left: 0, behavior: "auto" });
                      }
                    }}
                    className={cn(
                      "relative pb-1.5 font-serif text-xs uppercase tracking-[0.14em] transition-colors duration-300 whitespace-nowrap shrink-0 sm:pb-2 sm:text-base md:text-lg lg:text-xl",
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
            <h2 className="font-serif text-xl font-normal uppercase tracking-luxe text-ink sm:text-2xl md:text-3xl lg:text-4xl">
              {title}
            </h2>
          )}

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {currentCtaHref && (
              <Link
                href={currentCtaHref}
                className="group mr-2 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-luxe-sm text-stone transition-colors hover:text-ink"
              >
                View all
                <ArrowRight
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
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

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mt-4 sm:mt-6 md:mt-8 flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayProducts.map((product) => (
          <div
            key={`${activeTabIndex}-${product.id}`}
            className="w-[58vw] max-w-[250px] shrink-0 sm:w-[30vw] sm:max-w-[210px] md:w-[22vw] md:max-w-[230px] lg:w-[calc((100%-5rem)/5)] lg:max-w-none"
          >
            <ProductCard
              product={product}
              brandName={brandNames[product.brandSlug]}
              shadeSelect={shadeSelect}
              compact
              className="h-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
