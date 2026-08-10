import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/types";

interface FragranceMoodsProps {
  title: string;
  products: Product[];
}

/**
 * Fragrance "The Collection" — each scent presented as a mood, not a
 * bottle with a price. Alternating editorial rows: campaign imagery on
 * one side, name, mood line, notes and a discovery CTA on the other.
 */
export function FragranceMoods({ title, products }: FragranceMoodsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="fragrance-collection-heading" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal>
        <h2
          id="fragrance-collection-heading"
          className="text-center font-serif text-3xl font-medium uppercase tracking-luxe text-ink md:text-4xl"
        >
          {title}
        </h2>
      </Reveal>

      <div className="mt-14 flex flex-col gap-16 md:gap-24">
        {products.map((product, i) => {
          const primary = product.media[0];
          const reversed = i % 2 === 1;
          return (
            <Reveal key={product.id}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div
                  className={cn(
                    "relative aspect-[4/5] overflow-hidden bg-secondary",
                    reversed && "md:order-2",
                  )}
                >
                  <LettyImage
                    imageKey={primary.imageKey}
                    alt={primary.alt}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="transition-transform duration-700 ease-out hover:scale-105"
                  />
                </div>

                <div className={cn("flex flex-col items-start", reversed && "md:order-1")}>
                  <p className="text-xs font-medium uppercase tracking-luxe text-gold">
                    No. {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-serif text-3xl font-medium text-ink md:text-4xl">
                    {product.name}
                  </h3>
                  {product.tagline && (
                    <p className="mt-2 font-serif text-xl italic text-gold md:text-2xl">
                      {product.tagline}
                    </p>
                  )}
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
                    {product.description}
                  </p>
                  <p className="mt-4 text-sm font-medium tracking-tight text-ink">
                    {formatPrice(product.basePriceUsd)}
                  </p>
                  <div className="mt-6">
                    <LinedButton href={`/products/${product.slug}`} width="max-w-[220px]">
                      Discover
                    </LinedButton>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
