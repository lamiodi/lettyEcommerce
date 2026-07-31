"use client";

import Link from "next/link";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductRailProps {
  products: Product[];
}

/**
 * Template Cosmetics section — left-aligned serif title, hairline-divided
 * product grid, each card with a visible "Add to cart" action under a rule.
 */
export function ProductRail({ products }: ProductRailProps) {
  return (
    <section
      aria-labelledby="cosmetics-heading"
      className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28"
    >
      <Reveal>
        <h2
          id="cosmetics-heading"
          className="font-serif text-4xl font-medium text-ink md:text-5xl"
        >
          Editor&apos;s Selection
        </h2>
      </Reveal>

      <div className="mt-8 py-10 md:py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={0.06 * i} className="h-full">
              <CosmeticCard product={product} />
            </Reveal>
          ))}
        </div>
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
