import { ProductCard } from "@/components/product/product-card";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import type { Product } from "@/types";

interface DepartmentGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  brandNames: Record<string, string>;
  ctaHref: string;
  ctaLabel?: string;
  limit?: number;
  hideBestSellerBadge?: boolean;
}

/**
 * Closing product grid for a department world — "more products" after the
 * editorial journey, with a quiet CTA into the full filtered shop view.
 */
export function DepartmentGrid({
  title,
  subtitle,
  products,
  brandNames,
  ctaHref,
  ctaLabel = "View All",
  limit = 8,
  hideBestSellerBadge = false,
}: DepartmentGridProps) {
  if (products.length === 0) {
    return (
      <section aria-label={title} className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <Reveal className="flex flex-col items-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            CONFIDENTIAL ACCESS
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium uppercase tracking-luxe text-ink md:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
            Private boutique appointments and bespoke allocations are available upon request through our client concierge.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinedButton href="/shop">Browse Global Shop</LinedButton>
            <LinedButton href="/contact?mode=concierge" tone="stone">
              Contact Concierge
            </LinedButton>
          </div>
        </Reveal>
      </section>
    );
  }

  const displayProducts = products.slice(0, limit);

  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal className="flex flex-col items-center text-center">
        <h2 className="font-serif text-3xl font-medium uppercase tracking-luxe text-ink md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone md:text-base">
            {subtitle}
          </p>
        )}
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-4 md:gap-x-5 xl:gap-x-6">
        {displayProducts.map((product, i) => (
          <Reveal key={product.id} delay={0.04 * (i % 4)}>
            <ProductCard
              product={product}
              brandName={brandNames[product.brandSlug]}
              hideBestSellerBadge={hideBestSellerBadge}
            />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14 flex justify-center">
        <LinedButton href={ctaHref} width="max-w-[280px]">
          {ctaLabel}
        </LinedButton>
      </Reveal>
    </section>
  );
}
