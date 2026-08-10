"use client";

import Link from "next/link";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import type { ImageKey } from "@/lib/images";
import type { Product } from "@/types";

interface ShopTheLookProps {
  title: string;
  imageKey: ImageKey;
  products: Product[];
}

/**
 * Fashion "Shop the Look" — a complete styled outfit photographed as one
 * editorial image, with each individual piece listed alongside for
 * purchase. Turns a lookbook into a cart in one stop.
 */
export function ShopTheLook({ title, imageKey, products }: ShopTheLookProps) {
  const addLine = useCartStore((s) => s.addLine);

  if (products.length === 0) return null;

  const addToCart = (product: Product) => {
    const defaultVariant = product.variants[0];
    if (!defaultVariant) return;
    addLine({ productSlug: product.slug, variantId: defaultVariant.id, quantity: 1 });
    toast.success(`${product.name} added to your bag`);
  };

  return (
    <section aria-labelledby="shop-the-look-heading" className="bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-28">
        <Reveal>
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <LettyImage
              imageKey={imageKey}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="transition-transform duration-700 ease-out hover:scale-105"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-xs font-medium uppercase tracking-luxe text-gold">The Atelier</p>
          <h2
            id="shop-the-look-heading"
            className="mt-3 font-serif text-3xl font-medium uppercase tracking-luxe text-ink md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
            One considered look, piece by piece. Add each item individually,
            or take the whole silhouette.
          </p>

          <ul className="mt-8 flex flex-col">
            {products.map((product) => {
              const primary = product.media[0];
              return (
                <li
                  key={product.id}
                  className="flex items-center gap-4 border-t border-line py-4 last:border-b"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    aria-label={product.name}
                    className="relative h-20 w-16 shrink-0 overflow-hidden bg-secondary"
                  >
                    <LettyImage imageKey={primary.imageKey} alt={primary.alt} sizes="64px" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-serif text-[15px] font-medium leading-snug text-ink transition-colors hover:text-stone"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-stone">{formatPrice(product.basePriceUsd)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="shrink-0 border border-ink/30 px-4 py-2 text-[10px] font-medium uppercase tracking-luxe-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                  >
                    Add to Bag
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
