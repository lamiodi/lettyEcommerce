"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/shared/rating-stars";
import { useCartStore } from "@/lib/store/cart";
import { useIsWishlisted, useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  brandName?: string;
  className?: string;
}

/**
 * Shared product card — image swap on hover, quick add, wishlist toggle.
 * Used on the homepage rails, PLP grids and related-product carousels.
 */
export function ProductCard({ product, brandName, className }: ProductCardProps) {
  const hydrated = useHydrated();
  const addLine = useCartStore((s) => s.addLine);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useIsWishlisted(product.slug);

  const primary = product.media[0];
  const secondary = product.media[1];
  const defaultVariant = product.variants[0];
  const onSale = product.compareAtPriceUsd != null && product.compareAtPriceUsd > product.basePriceUsd;

  const quickAdd = () => {
    if (!defaultVariant) return;
    addLine({ productSlug: product.slug, variantId: defaultVariant.id, quantity: 1 });
    toast.success(`${product.name} added to your bag`);
  };

  const onToggleWishlist = () => {
    toggleWishlist(product.slug);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved to your wishlist");
  };

  return (
    <div className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0"
        >
          <LettyImage
            imageKey={primary.imageKey}
            alt={primary.alt}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "transition-transform duration-700 ease-out group-hover:scale-105",
              secondary && "group-hover:opacity-0",
            )}
          />
          {secondary && (
            <LettyImage
              imageKey={secondary.imageKey}
              alt={secondary.alt}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges — bottom-right of the image */}
        <div className="pointer-events-none absolute bottom-2 right-2 flex flex-col items-end gap-1">
          {onSale && (
            <span className="bg-ink px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-luxe-sm text-ivory">
              Sale
            </span>
          )}
          {product.isNew && !onSale && (
            <span className="bg-gold px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-luxe-sm text-ink">
              New
            </span>
          )}
          {product.isBestSeller && !onSale && !product.isNew && (
            <span className="bg-ivory/90 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-luxe-sm text-ink">
              Best Seller
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={hydrated && wishlisted}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-stone transition hover:text-ink"
        >
          <Heart
            className={cn(
              "h-[18px] w-[18px] transition",
              hydrated && wishlisted && "fill-gold stroke-gold",
            )}
            strokeWidth={1.25}
          />
        </button>

      </div>

      <div className="flex flex-col items-center text-center gap-1 px-1 pt-3 sm:pt-3.5">
        {brandName && (
          <p className="text-[0.65rem] font-medium uppercase tracking-luxe text-stone">
            {brandName}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="text-[15px] leading-snug font-medium font-serif text-ink transition-colors hover:text-stone"
        >
          {product.name}
        </Link>
        <RatingStars rating={product.rating} count={product.reviewCount} className="mt-0.5" />
        <Price
          price={product.basePriceUsd}
          compareAt={product.compareAtPriceUsd}
          className="mt-0.5 text-[15px] font-medium tracking-tight text-ink"
        />

        {defaultVariant && (
          <div className="w-full mt-3 sm:mt-3.5">
            <hr className="w-full border-ink/30" />
            <button
              type="button"
              onClick={quickAdd}
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
}
