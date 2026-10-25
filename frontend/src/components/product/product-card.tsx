"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewDialog } from "@/components/product/review-dialog";
import { ShadeSelectDialog } from "@/components/product/shade-select-dialog";
import { useCartStore } from "@/lib/store/cart";
import { useIsWishlisted, useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface ProductCardProps {
  product: Product;
  brandName?: string;
  className?: string;
  hideBestSellerBadge?: boolean;
  /** Swap "Add to bag" for "Select Shade" + shade picker modal (department worlds). */
  shadeSelect?: boolean;
  /** Compact presentation with reduced image aspect ratio, typography, and tighter padding */
  compact?: boolean;
}

/**
 * Shared product card — image swap on hover, quick add, wishlist toggle,
 * and interactive shade swatch selection with instant image preview.
 */
export function ProductCard({
  product,
  brandName,
  className,
  hideBestSellerBadge = false,
  shadeSelect = false,
  compact = false,
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants[0],
  );
  const [previewVariant, setPreviewVariant] = useState<ProductVariant | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shadeDialogOpen, setShadeDialogOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const hydrated = useHydrated();
  const addLine = useCartStore((s) => s.addLine);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useIsWishlisted(product.slug);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  const activeVariant = previewVariant ?? selectedVariant ?? product.variants[0];

  const primary = product.media[0];
  const secondary = product.media[1];

  // Active variant image (updates dynamically when variant is selected or hovered)
  const activeImageKey =
    activeVariant?.image ||
    activeVariant?.images?.[0] ||
    primary?.imageKey;

  // Secondary angle shot only if available for this specific variant,
  // or on default variant with product secondary media
  const isDefaultVariant = !activeVariant || activeVariant.id === product.variants[0]?.id;
  const secondaryImageKey =
    activeVariant?.images?.[1] ||
    (isDefaultVariant ? secondary?.imageKey : undefined);

  const activePrice = activeVariant?.priceOverrideUsd ?? product.basePriceUsd;

  const onSale = product.compareAtPriceUsd != null && product.compareAtPriceUsd > activePrice;

  const quickAdd = () => {
    const variantToAdd = selectedVariant ?? product.variants[0];
    if (!variantToAdd) return;
    addLine({ productSlug: product.slug, variantId: variantToAdd.id, quantity: 1 });
    toast.success(
      product.isPreorder
        ? `${product.name} added to your bag as a preorder`
        : `${product.name}${variantToAdd.color ? ` (${variantToAdd.color})` : ""} added to your bag`,
    );
  };

  // Only products with an actual shade range get the picker — single-shade
  // or size-only products keep the one-tap add.
  const useShadeModal = shadeSelect && product.variants.filter((v) => v.color).length > 1;

  const onToggleWishlist = () => {
    toggleWishlist(product.slug);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved to your wishlist");
  };

  const productHref = activeVariant?.color
    ? `/products/${product.slug}?shade=${encodeURIComponent(activeVariant.color)}`
    : `/products/${product.slug}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col",
        /* Card lift + shadow on hover — full cards only; rails stay static
           (client preference: no card motion in product rails). */
        !compact &&
          "transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(17,17,17,0.06)]",
        className,
      )}
    >
      <div
        className={cn(
          "group/image relative overflow-hidden bg-secondary",
          compact ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[3/4]",
        )}
      >
        <Link
          href={productHref}
          aria-label={product.name}
          className="absolute inset-0 block"
        >
          <div className="relative h-full w-full">
            <LettyImage
              key={`active-${activeImageKey}`}
              imageKey={activeImageKey}
              alt={activeVariant?.color ? `${product.name}, ${activeVariant.color}` : primary.alt}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                !compact && "transition-all duration-500 ease-out group-hover/image:scale-[1.03]",
                canHover && secondaryImageKey && "group-hover/image:opacity-0",
              )}
            />
            {canHover && secondaryImageKey && (
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none opacity-0 group-hover/image:opacity-100",
                  !compact && "transition-opacity duration-500",
                )}
              >
                <LettyImage
                  key={`secondary-${secondaryImageKey}`}
                  imageKey={secondaryImageKey}
                  alt={secondary?.alt || primary.alt}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  containerClassName="bg-transparent"
                  className={cn(
                    !compact && "transition-all duration-500 ease-out group-hover/image:scale-[1.03]",
                  )}
                />
              </div>
            )}
          </div>
        </Link>

        {/* Badges — bottom-right of the image */}
        <div className="pointer-events-none absolute bottom-2 right-2 flex flex-col items-end gap-1">
          {product.isPreorder && (
            <span
              className={cn(
                "bg-ink uppercase tracking-luxe-sm text-ivory font-medium",
                compact ? "px-2 py-0.5 text-[0.55rem]" : "px-2.5 py-1 text-[0.6rem]",
              )}
            >
              Preorder
            </span>
          )}
          {onSale && (
            <span
              className={cn(
                "bg-ink uppercase tracking-luxe-sm text-ivory font-medium",
                compact ? "px-2 py-0.5 text-[0.55rem]" : "px-2.5 py-1 text-[0.6rem]",
              )}
            >
              Sale
            </span>
          )}
          {product.isNew && !onSale && (
            <span
              className={cn(
                "bg-gold uppercase tracking-luxe-sm text-ink font-medium",
                compact ? "px-2 py-0.5 text-[0.55rem]" : "px-2.5 py-1 text-[0.6rem]",
              )}
            >
              New
            </span>
          )}
          {!hideBestSellerBadge && product.isBestSeller && !onSale && !product.isNew && (
            <span
              className={cn(
                "bg-ivory/90 uppercase tracking-luxe-sm text-ink font-medium",
                compact ? "px-2 py-0.5 text-[0.55rem]" : "px-2.5 py-1 text-[0.6rem]",
              )}
            >
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
          className={cn(
            "absolute right-2 top-2 flex items-center justify-center text-stone transition-all duration-300 hover:text-ink active:scale-90",
            compact ? "h-7 w-7 sm:h-9 sm:w-9" : "h-9 w-9",
          )}
        >
          <Heart
            className={cn(
              "transition-all duration-300",
              compact ? "h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" : "h-[18px] w-[18px]",
              hydrated && wishlisted && "fill-gold stroke-gold scale-110",
            )}
            strokeWidth={1.25}
          />
        </button>

      </div>

      <div
        className={cn(
          "flex flex-1 flex-col items-center text-center px-1",
          compact ? "gap-0.5 pt-2 sm:pt-2.5" : "gap-0.5 sm:gap-1 pt-2.5 sm:pt-3",
        )}
      >
        {brandName && (
          <p
            className={cn(
              "font-medium uppercase tracking-luxe text-stone",
              compact ? "text-[0.55rem] sm:text-[0.625rem]" : "text-[0.625rem]",
            )}
          >
            {brandName}
          </p>
        )}
        <Link
          href={productHref}
          className={cn(
            "leading-snug font-medium font-serif text-ink transition-colors duration-300 hover:text-stone line-clamp-2",
            compact
              ? "min-h-[2.75em] text-[12px] sm:text-[13px] md:text-[14px]"
              : "text-[13.5px] sm:text-[14px]",
          )}
        >
          {product.name}
        </Link>
        {product.variants.filter((v) => v.colorHex).length > 0 && (
          <div className={cn("flex flex-col items-center", compact ? "mt-0.5 gap-0.5" : "mt-1 gap-1")}>
            <div
              className={cn(
                "flex items-center justify-center flex-wrap",
                compact ? "gap-0.5 max-w-[160px] sm:max-w-[200px]" : "gap-1 max-w-[210px]",
              )}
              role="radiogroup"
              aria-label="Available shades"
              onMouseLeave={() => setPreviewVariant(null)}
            >
              {product.variants
                .filter((v) => v.colorHex)
                .map((v) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select shade ${v.color}`}
                      title={v.color ?? undefined}
                      onMouseEnter={() => setPreviewVariant(v)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariant(v);
                        setPreviewVariant(null);
                      }}
                      className={cn(
                        "group/swatch relative flex items-center justify-center cursor-pointer p-0.5",
                        compact ? "h-5 w-5 sm:h-5.5 sm:w-5.5" : "h-6 w-6",
                      )}
                    >
                      <span
                        className={cn(
                          "rounded-full border border-ivory shadow-xs transition-all duration-200 pointer-events-none",
                          compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3.5 w-3.5",
                          isSelected
                            ? "ring-1.5 sm:ring-2 ring-ink ring-offset-0.5 sm:ring-offset-1 scale-110 sm:scale-115 z-10"
                            : "opacity-75 group-hover/swatch:opacity-100 group-hover/swatch:scale-110",
                        )}
                        style={{ backgroundColor: v.colorHex }}
                      />
                    </button>
                  );
                })}
            </div>
            <span
              className={cn(
                "uppercase tracking-luxe-sm text-stone font-medium",
                compact ? "text-[8.5px] sm:text-[9.5px]" : "text-[10px]",
              )}
            >
              {activeVariant?.color
                ? activeVariant.color
                : `${product.variants.filter((v) => v.color).length} Shades`}
            </span>
          </div>
        )}
        <RatingStars
          rating={product.rating}
          count={product.reviewCount}
          size={compact ? "xs" : "sm"}
          className="mt-0.5"
          onClick={() => setReviewOpen(true)}
        />
        <Price
          price={activePrice}
          compareAt={product.compareAtPriceUsd}
          className={cn(
            "font-medium tracking-tight text-ink",
            compact
              ? "mt-auto text-[12px] sm:text-[13px] md:text-[14px]"
              : "mt-0.5 text-[13.5px] sm:text-[14px]",
          )}
        />

        {selectedVariant && (
          <div className={cn("w-full", compact ? "pt-1.5 sm:pt-2.5" : "mt-2.5 sm:mt-3")}>
            <hr className="w-full border-ink/30 transition-colors duration-300 group-hover:border-ink/50" />
            <button
              type="button"
              onClick={() => (useShadeModal ? setShadeDialogOpen(true) : quickAdd())}
              className={cn(
                "w-full font-medium text-ink transition-all duration-300 hover:text-stone tracking-widest uppercase active:scale-[0.97]",
                compact
                  ? "py-1.5 sm:py-2 text-[9px] sm:text-[10px] md:text-[11px]"
                  : "py-2.5 text-[10.5px] sm:text-[11px]",
              )}
            >
              {useShadeModal
                ? "Select Shade"
                : product.isPreorder
                  ? "Pre-Order"
                  : "Add to bag"}
            </button>
            <hr className="w-full border-ink/30 transition-colors duration-300 group-hover:border-ink/50" />
          </div>
        )}
      </div>


      <ReviewDialog
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productName={product.name}
        productSlug={product.slug}
      />

      {useShadeModal && (
        <ShadeSelectDialog
          isOpen={shadeDialogOpen}
          onClose={() => setShadeDialogOpen(false)}
          product={product}
          brandName={brandName}
          defaultVariantId={selectedVariant?.id}
        />
      )}
    </div>
  );
}
