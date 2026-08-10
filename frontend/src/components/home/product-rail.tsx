"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { usePagedTrack } from "@/lib/hooks/use-paged-track";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductRailProps {
  products: Product[];
}

/**
 * Homepage selection — a Dior-style paginated carousel: left-aligned serif
 * title, hairline "Add to Bag" cards on a snap track, and a "1 / N" page
 * counter flanked by quiet arrows.
 */
export function ProductRail({ products }: ProductRailProps) {
  const { trackRef, page, pages, onScroll, scrollByPage } = usePagedTrack();

  return (
    <section
      aria-labelledby="cosmetics-heading"
      className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28"
    >
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <h2
            id="cosmetics-heading"
            className="font-serif text-4xl font-medium text-ink md:text-5xl"
          >
            Editor&apos;s Selection
          </h2>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="text-xs font-medium tracking-luxe-sm text-stone tabular-nums"
            >
              {page} / {pages}
            </span>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={page <= 1}
              aria-label="Scroll products left"
              className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone disabled:opacity-40 disabled:hover:border-line"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={page >= pages}
              aria-label="Scroll products right"
              className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-stone disabled:opacity-40 disabled:hover:border-line"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </Reveal>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:py-12"
      >
        {products.map((product, i) => (
          <Reveal
            key={product.id}
            delay={0.05 * i}
            className="w-[46vw] shrink-0 snap-start sm:w-[31vw] lg:w-[calc((100%-3.75rem)/4)]"
          >
            <CosmeticCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CosmeticCard({ product }: { product: Product }) {
  const addLine = useCartStore((s) => s.addLine);
  const primary = product.media[0];
  const defaultVariant = product.variants[0];

  const addToCart = () => {
    if (!defaultVariant) return;
    addLine({
      productSlug: product.slug,
      variantId: defaultVariant.id,
      quantity: 1,
    });
    toast.success(`${product.name} added to your bag`);
  };

  return (
    <div className="group flex h-full flex-col">
      <Link
        href={`/products/${product.slug}`}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-card"
      >
        <LettyImage
          imageKey={primary.imageKey}
          alt={primary.alt}
          sizes="(max-width: 640px) 50vw, 25vw"
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </Link>

      {/* Title sits closer to the image; let it flow naturally without forcing a large minimum height */}
      <h3 className="mt-3 text-center font-serif text-[15px] font-medium leading-snug text-ink line-clamp-2">
        <Link
          href={`/products/${product.slug}`}
          className="transition-colors hover:text-stone"
        >
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 text-center text-[15px] font-medium tracking-tight text-stone">
        {formatPrice(product.basePriceUsd)}
      </p>

      {defaultVariant && (
        <div className="w-full mt-3">
          <hr className="w-full border-ink/30" />
          <button
            type="button"
            onClick={addToCart}
            className="w-full py-3 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-widest uppercase"
          >
            Add to Bag
          </button>
          <hr className="w-full border-ink/30" />
        </div>
      )}
    </div>
  );
}
