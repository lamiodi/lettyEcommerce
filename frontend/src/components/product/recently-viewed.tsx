"use client";

import { useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRecentlyViewedStore } from "@/lib/store/recently-viewed";
import { products } from "@/lib/mock/products";
import { brands } from "@/lib/mock/catalog";

/**
 * Recently viewed rail. Registers the current product on mount and renders
 * previously viewed pieces (excluding it). Client-safe today via local
 * mock joins — same pattern as lib/cart-details.ts.
 */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const hydrated = useHydrated();
  const push = useRecentlyViewedStore((s) => s.push);
  const slugs = useRecentlyViewedStore((s) => s.slugs);

  useEffect(() => {
    push(currentSlug);
  }, [currentSlug, push]);

  if (!hydrated) return null;

  const viewed = slugs
    .filter((s) => s !== currentSlug)
    .map((s) => products.find((p) => p.slug === s))
    .filter((p) => p != null)
    .slice(0, 4);

  if (viewed.length === 0) return null;

  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-20 border-t border-line pt-16">
      <SectionHeading eyebrow="Your Trail" title="Recently viewed" />
      <span id="recently-viewed-heading" className="sr-only">
        Recently viewed products
      </span>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
        {viewed.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            brandName={brandNames[product.brandSlug]}
          />
        ))}
      </div>
    </section>
  );
}
