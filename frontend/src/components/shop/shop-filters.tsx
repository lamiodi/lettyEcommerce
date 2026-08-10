"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { formatPrice, pluralize } from "@/lib/utils";
import { SUBCATEGORY_LABELS } from "@/lib/constants";
import type { Brand, Category, SortOption } from "@/types";

export const SORTS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

interface ShopFilterProps {
  categories: Category[];
  brands: Brand[];
  priceRange: { min: number; max: number };
}

/** Read/write helper for the shop's URL-driven filter state. */
function useShopParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replace = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return { searchParams, replace };
}

export function parseBrandParam(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

/** Desktop sidebar filters. */
export function FilterSidebar({ categories, brands, priceRange }: ShopFilterProps) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <FilterBody categories={categories} brands={brands} priceRange={priceRange} />
    </aside>
  );
}

/** Mobile filter sheet trigger + panel. */
export function MobileFilters({ categories, brands, priceRange }: ShopFilterProps) {
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex h-10 items-center gap-2 border border-line bg-transparent px-4 text-xs font-medium uppercase tracking-luxe text-ink lg:hidden hover:border-stone transition"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        Filters
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-ivory p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="font-serif text-xl font-medium text-ink">
            Refine
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterBody categories={categories} brands={brands} priceRange={priceRange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterBody({ categories, brands, priceRange }: ShopFilterProps) {
  const { searchParams, replace } = useShopParams();
  const activeCategory = searchParams.get("category");
  const activeBrands = parseBrandParam(searchParams.get("brand"));

  const min = Number(searchParams.get("min")) || priceRange.min;
  const max = Number(searchParams.get("max")) || priceRange.max;
  const [price, setPrice] = useState<[number, number]>([min, max]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the slider in sync when the URL changes elsewhere (chips, clear-all)
  useEffect(() => {
    setPrice([min, max]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setCategory = (slug: string | null) =>
    replace((p) => {
      if (slug) p.set("category", slug);
      else p.delete("category");
      // Subcategory only makes sense within its category — drop it on change.
      p.delete("sub");
    });

  const toggleBrand = (slug: string) =>
    replace((p) => {
      const next = activeBrands.includes(slug)
        ? activeBrands.filter((b) => b !== slug)
        : [...activeBrands, slug];
      if (next.length) p.set("brand", next.join(","));
      else p.delete("brand");
    });

  const commitPrice = (values: [number, number]) =>
    replace((p) => {
      if (values[0] <= priceRange.min) p.delete("min");
      else p.set("min", String(values[0]));
      if (values[1] >= priceRange.max) p.delete("max");
      else p.set("max", String(values[1]));
    });

  const onPriceChange = (values: number | readonly number[]) => {
    const next: [number, number] = Array.isArray(values)
      ? [values[0], values[1]]
      : [values, values];
    setPrice(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => commitPrice(next), 350);
  };

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Category filters">
        <h3 className="text-xs font-medium uppercase tracking-luxe text-ink">Category</h3>
        <ul className="mt-4 flex flex-col gap-2.5">
          <li>
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-current={!activeCategory ? "true" : undefined}
              className={`text-sm transition-colors ${
                !activeCategory ? "font-medium text-ink" : "text-stone hover:text-ink"
              }`}
            >
              Shop All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCategory(c.slug)}
                aria-current={activeCategory === c.slug ? "true" : undefined}
                className={`text-sm transition-colors ${
                  activeCategory === c.slug
                    ? "font-medium text-ink"
                    : "text-stone hover:text-ink"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Brand filters">
        <h3 className="text-xs font-medium uppercase tracking-luxe text-ink">Brand</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {brands.map((b) => {
            const checked = activeBrands.includes(b.slug);
            return (
              <li key={b.id}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-stone transition-colors hover:text-ink">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleBrand(b.slug)}
                    aria-label={`Filter by ${b.name}`}
                  />
                  {b.name}
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Price filter">
        <h3 className="text-xs font-medium uppercase tracking-luxe text-ink">Price</h3>
        <div className="mt-5 px-1">
          <Slider
            value={price}
            onValueChange={onPriceChange}
            min={priceRange.min}
            max={priceRange.max}
            aria-label="Price range"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-stone">
            <span>{formatPrice(price[0])}</span>
            <span>{formatPrice(price[1])}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Sort select shown above the product grid. */
export function SortSelect() {
  const { searchParams, replace } = useShopParams();
  const sort = (searchParams.get("sort") as SortOption) ?? "featured";

  return (
    <Select
      value={sort}
      onValueChange={(value) =>
        replace((p) => {
          if (value == null || value === "featured") p.delete("sort");
          else p.set("sort", value);
        })
      }
    >
      <SelectTrigger
        aria-label="Sort products"
        className="h-10 w-48 justify-between border border-line bg-transparent px-4 text-xs uppercase tracking-luxe"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border border-line bg-card">
        {SORTS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-sm">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Active filter chips with one-tap removal. */
export function FilterChips({ categories, brands, priceRange }: ShopFilterProps) {
  const { searchParams, replace } = useShopParams();
  const category = searchParams.get("category");
  const sub = searchParams.get("sub");
  const activeBrands = parseBrandParam(searchParams.get("brand"));
  const min = searchParams.get("min");
  const max = searchParams.get("max");

  const chips: { key: string; label: string; remove: () => void }[] = [];

  if (category) {
    const name = categories.find((c) => c.slug === category)?.name ?? category;
    chips.push({
      key: "category",
      label: name,
      remove: () =>
        replace((p) => {
          p.delete("category");
          p.delete("sub");
        }),
    });
  }
  if (sub) {
    chips.push({
      key: "sub",
      label: SUBCATEGORY_LABELS[sub] ?? sub,
      remove: () => replace((p) => p.delete("sub")),
    });
  }
  for (const slug of activeBrands) {
    const name = brands.find((b) => b.slug === slug)?.name ?? slug;
    chips.push({
      key: `brand-${slug}`,
      label: name,
      remove: () =>
        replace((p) => {
          const next = activeBrands.filter((b) => b !== slug);
          if (next.length) p.set("brand", next.join(","));
          else p.delete("brand");
        }),
    });
  }
  if (min || max) {
    const lo = Number(min) || priceRange.min;
    const hi = Number(max) || priceRange.max;
    chips.push({
      key: "price",
      label: `${formatPrice(lo)} – ${formatPrice(hi)}`,
      remove: () =>
        replace((p) => {
          p.delete("min");
          p.delete("max");
        }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 border border-line bg-transparent px-3 py-1.5 text-xs text-ink transition hover:border-stone"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => replace((p) => {
          p.delete("category");
          p.delete("sub");
          p.delete("brand");
          p.delete("min");
          p.delete("max");
        })}
        className="text-xs font-medium uppercase tracking-luxe text-stone underline-offset-4 transition hover:text-ink hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

/** Result count line, e.g. "12 pieces". */
export function ResultCount({ count }: { count: number }) {
  return (
    <p className="text-sm text-stone" role="status">
      {count} {pluralize(count, "piece")}
    </p>
  );
}
