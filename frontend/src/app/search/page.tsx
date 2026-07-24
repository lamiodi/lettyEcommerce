import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { getBrands } from "@/lib/data/catalog";
import { searchProducts } from "@/lib/data/products";
import { pluralize } from "@/lib/utils";

const POPULAR = ["Silk", "Parfum", "Vitamin C", "Cashmere", "Lipstick", "Blazer"];

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim();

  const [results, brands] = await Promise.all([
    query ? searchProducts(query) : Promise.resolve([]),
    getBrands(),
  ]);
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-luxe text-gold">Search</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
          {query ? (
            <>
              Results for <span className="italic">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search the boutique"
          )}
        </h1>
        <p className="mt-3 text-sm text-stone" role="status">
          {query
            ? `${results.length} ${pluralize(results.length, "piece")} found`
            : "Search by product, brand or category."}
        </p>
      </header>

      {query && results.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {results.map((product, i) => (
            <Reveal key={product.id} delay={0.04 * (i % 4)}>
              <ProductCard product={product} brandName={brandNames[product.brandSlug]} />
            </Reveal>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="mt-12 flex flex-col items-center rounded-xl border border-dashed border-line bg-card px-6 py-20 text-center">
          <SearchX className="h-8 w-8 text-gold" aria-hidden strokeWidth={1.5} />
          <h2 className="mt-4 font-serif text-2xl font-medium text-ink">
            Nothing found for &ldquo;{query}&rdquo;
          </h2>
          <p className="mt-2 max-w-sm text-sm text-stone">
            Check the spelling, or try one of our most searched terms below.
          </p>
        </div>
      )}

      {(!query || results.length === 0) && (
        <div className="mt-10">
          <p className="text-xs font-medium uppercase tracking-luxe-sm text-stone">
            Popular searches
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-line bg-card px-4 py-2 text-sm text-ink transition hover:border-gold"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
