"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
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
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-3xl font-medium uppercase tracking-luxe text-ink md:text-4xl">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {ctaHref && (
              <Link
                href={ctaHref}
                className="group mr-2 hidden items-center gap-1.5 text-[11px] font-medium uppercase tracking-luxe-sm text-stone transition-colors hover:text-ink sm:inline-flex"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll products left"
              className="hidden h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone md:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll products right"
              className="hidden h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone md:inline-flex"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </Reveal>

      <div
        ref={trackRef}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product, i) => (
          <Reveal
            key={product.id}
            delay={0.05 * i}
            className="w-[68vw] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-3.75rem)/4)]"
          >
            <ProductCard product={product} brandName={brandNames[product.brandSlug]} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
