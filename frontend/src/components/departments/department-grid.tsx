import { ProductCard } from "@/components/product/product-card";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import type { Product } from "@/types";

interface DepartmentGridProps {
  title: string;
  products: Product[];
  brandNames: Record<string, string>;
  ctaHref: string;
}

/**
 * Closing product grid for a department world — "more products" after the
 * editorial journey, with a quiet CTA into the full filtered shop view.
 */
export function DepartmentGrid({ title, products, brandNames, ctaHref }: DepartmentGridProps) {
  if (products.length === 0) return null;

  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal>
        <h2 className="font-serif text-3xl font-medium uppercase tracking-luxe text-ink md:text-4xl">
          {title}
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
        {products.slice(0, 8).map((product, i) => (
          <Reveal key={product.id} delay={0.04 * (i % 4)}>
            <ProductCard product={product} brandName={brandNames[product.brandSlug]} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14 flex justify-center">
        <LinedButton href={ctaHref} width="max-w-[260px]">
          View All
        </LinedButton>
      </Reveal>
    </section>
  );
}
