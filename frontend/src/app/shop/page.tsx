import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import {
  FilterChips,
  FilterSidebar,
  MobileFilters,
  ResultCount,
  SortSelect,
} from "@/components/shop/shop-filters";
import { getBrands, getCategories, getCategoryBySlug } from "@/lib/data/catalog";
import { getPriceRange, getProducts } from "@/lib/data/products";
import { categoryDescription } from "@/lib/constants";
import type { ProductFilters, SortOption } from "@/types";

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SORT_VALUES: SortOption[] = ["featured", "newest", "price-asc", "price-desc", "rating"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const sort = first(params.sort);
  return {
    categorySlug: first(params.category),
    brandSlugs: first(params.brand)?.split(",").filter(Boolean),
    minPrice: Number(first(params.min)) || undefined,
    maxPrice: Number(first(params.max)) || undefined,
    sort: SORT_VALUES.includes(sort as SortOption) ? (sort as SortOption) : "featured",
  };
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categorySlug = first(params.category);
  const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;
  const title = category ? category.name : "Shop All";
  const canonicalUrl = categorySlug ? `/shop?category=${categorySlug}` : "/shop";
  return {
    title,
    description: category
      ? categoryDescription(category)
      : "Shop the full LETTY edit — hair, fragrance, skincare, makeup and fashion.",
    alternates: { canonical: canonicalUrl },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [products, categories, brands, priceRange, activeCategory] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getBrands(),
    getPriceRange(),
    filters.categorySlug ? getCategoryBySlug(filters.categorySlug) : null,
  ]);

  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));
  const filterProps = { categories, brands, priceRange };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-luxe text-gold">The Boutique</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
          {activeCategory ? activeCategory.name : "Shop All"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          {activeCategory
            ? categoryDescription(activeCategory)
            : "The complete LETTY edit — hair rituals, fragrance wardrobes, skincare ceremonies, couture makeup and the Atelier fashion line."}
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        <Suspense fallback={null}>
          <FilterSidebar {...filterProps} />
        </Suspense>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <Suspense fallback={null}>
              <MobileFilters {...filterProps} />
            </Suspense>
            <ResultCount count={products.length} />
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <div className="mt-4">
            <Suspense fallback={null}>
              <FilterChips {...filterProps} />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="mt-16 flex flex-col items-center rounded-xl border border-dashed border-line bg-card px-6 py-20 text-center">
              <SearchX className="h-8 w-8 text-gold" aria-hidden strokeWidth={1.5} />
              <h2 className="mt-4 font-serif text-2xl font-medium text-ink">
                No pieces match your edit
              </h2>
              <p className="mt-2 max-w-sm text-sm text-stone">
                Try widening the price range or removing a filter — the perfect
                piece may be one refinement away.
              </p>
              <Link
                href={activeCategory ? `/shop?category=${activeCategory.slug}` : "/shop"}
                className="mt-6 inline-flex h-11 items-center rounded-lg bg-ink px-8 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition hover:bg-ink/90"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <Suspense fallback={null}>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
                {products.map((product, i) => (
                  <Reveal key={product.id} delay={0.04 * (i % 4)}>
                    <ProductCard product={product} brandName={brandNames[product.brandSlug]} />
                  </Reveal>
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
