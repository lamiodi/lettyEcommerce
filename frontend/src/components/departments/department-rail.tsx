"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { usePagedTrack } from "@/lib/hooks/use-paged-track";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface DepartmentRailProps {
  title: string;
  products: Product[];
  brandNames: Record<string, string>;
  ctaHref?: string;
}

/**
 * Horizontal product carousel used across department pages — New &
 * Noteworthy, Bestsellers, New Season, The Signatures. A small row of
 * cards on a scroll-snap track with quiet arrow controls, so the world
 * teases products instead of dumping a full grid.
 */
export function DepartmentRail({ title, products, brandNames, ctaHref }: DepartmentRailProps) {
  const { trackRef, page, pages, onScroll, scrollByPage } = usePagedTrack();

  if (products.length === 0) return null;

  const isBestsellers = title.toLowerCase().includes("bestseller");
  const isNewNoteworthy = title.toLowerCase().includes("new");
  const displayProducts = isNewNoteworthy ? products.slice(0, 8) : products;

  return (
    <section
      aria-label={title}
      className={cn(
        "mx-auto max-w-7xl px-4 md:px-8",
        isBestsellers ? "py-12 md:py-20" : "py-16 md:py-24"
      )}
    >
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <h2
            className={cn(
              "font-serif font-normal uppercase text-ink",
              isBestsellers
                ? "text-2xl sm:text-3xl md:text-4xl tracking-[0.26em]"
                : "text-3xl font-medium tracking-luxe md:text-4xl"
            )}
          >
            {isBestsellers ? "B E S T S E L L E R S" : title}
          </h2>
          <div className="flex items-center gap-3">
            {ctaHref && !isNewNoteworthy && (
              <Link
                href={ctaHref}
                className="group mr-2 hidden items-center gap-1.5 text-[11px] font-medium uppercase tracking-luxe-sm text-stone transition-colors hover:text-ink sm:inline-flex"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
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
        className={cn(
          "flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isBestsellers ? "mt-6 md:mt-8" : "mt-10"
        )}
      >
        {displayProducts.map((product, i) => (
          <Reveal
            key={product.id}
            delay={0.05 * i}
            className={cn(
              "shrink-0 snap-start",
              isBestsellers
                ? "w-[76vw] sm:w-[48vw] md:w-[36vw] lg:w-[calc((100%-3.75rem)/4)]"
                : isNewNoteworthy
                ? "w-[64vw] sm:w-[38vw] md:w-[30vw] lg:w-[calc((100%-3.75rem)/4)]"
                : "w-[68vw] sm:w-[42vw] lg:w-[calc((100%-3.75rem)/4)]"
            )}
          >
            <ProductCard
              product={product}
              brandName={brandNames[product.brandSlug]}
              hideBestSellerBadge={isBestsellers}
            />
          </Reveal>
        ))}
      </div>

      {isNewNoteworthy && ctaHref && (
        <div className="mt-8 flex justify-center">
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-stone transition-colors duration-300 hover:text-ink"
          >
            View all
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      )}
    </section>
  );
}
