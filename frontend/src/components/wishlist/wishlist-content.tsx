"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { LinedButton } from "@/components/shared/lined-button";
import { RatingStars } from "@/components/shared/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/shared/skeletons";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ImageKey } from "@/lib/images";
import { brands } from "@/lib/mock/catalog";
import { products } from "@/lib/mock/products";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatPrice } from "@/lib/utils";

export function WishlistContent() {
  const hydrated = useHydrated();
  const slugs = useWishlistStore((s) => s.slugs);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const clearWishlist = useWishlistStore((s) => s.clear);
  const addLine = useCartStore((s) => s.addLine);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 md:px-8 md:py-16">
        <header className="space-y-2 border-b border-line pb-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-48 md:h-12" />
          <Skeleton className="h-3 w-32" />
        </header>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => slugs.includes(p.slug));
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  const handleAddToCart = (product: (typeof products)[0]) => {
    const variant = product.variants[0];
    if (!variant) return;

    addLine({
      productSlug: product.slug,
      variantId: variant.id,
      quantity: 1,
    });
    toast.success(`Added ${product.name} to your bag`);
  };

  if (wishlistedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Heart className="h-9 w-9 text-stone" strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-medium text-ink">Your Wishlist is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-stone">
          Save your desired formulations, fragrances, and fashion pieces to curate your personal ritual wishlist.
        </p>
        <div className="mt-8">
          <LinedButton href="/shop">Explore the Edit</LinedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16 space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-luxe text-stone">Saved Items</p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-ink">Your Wishlist</h1>
          <p className="mt-1 text-sm text-stone">
            {wishlistedProducts.length} saved {wishlistedProducts.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            clearWishlist();
            toast.info("Wishlist cleared.");
          }}
          className="text-[11px] uppercase tracking-luxe text-stone hover:text-ink transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear All Saved
        </button>
      </header>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {wishlistedProducts.map((p) => {
          const brandName = brandNames[p.brandSlug] ?? "LETTY";
          const firstImage = p.media[0];
          const defaultVariant = p.variants[0];

          return (
            <div key={p.id} className="group relative flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                {firstImage && (
                  <Link href={`/products/${p.slug}`}>
                    <LettyImage
                      imageKey={firstImage.imageKey as ImageKey}
                      alt={firstImage.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist(p.slug);
                    toast.info(`Removed ${p.name} from wishlist`);
                  }}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-ink transition hover:bg-ink hover:text-ivory"
                >
                  <Heart className="h-4 w-4 fill-ink" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-0.5 px-1 pt-3 sm:pt-4">
                <p className="text-[11px] uppercase tracking-luxe text-stone">
                  {brandName}
                </p>
                <Link
                  href={`/products/${p.slug}`}
                  className="font-serif text-sm font-medium text-ink transition-colors hover:text-stone"
                >
                  {p.name}
                </Link>
                <RatingStars rating={p.rating} count={p.reviewCount} />
                <p className="text-sm font-medium text-ink pt-0.5">
                  {formatPrice(p.basePriceUsd)}
                </p>

                {defaultVariant && (
                  <div className="w-full mt-3">
                    <hr className="w-full border-ink/30" />
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className="w-full py-3 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-widest uppercase"
                    >
                      Add to cart
                    </button>
                    <hr className="w-full border-ink/30" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
