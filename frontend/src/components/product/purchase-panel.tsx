"use client";

import { useMemo, useState } from "react";
import { Check, Heart, RotateCcw, Share2, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import { LinedButton } from "@/components/shared/lined-button";
import { Price } from "@/components/shared/price";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewDialog } from "@/components/product/review-dialog";
import { useCartStore } from "@/lib/store/cart";
import { useIsWishlisted, useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface PurchasePanelProps {
  product: Product;
  brandName?: string;
}

/** Sticky PDP purchase panel — variants, quantity, bag, wishlist, share. */
export function PurchasePanel({ product, brandName }: PurchasePanelProps) {
  const hydrated = useHydrated();
  const addLine = useCartStore((s) => s.addLine);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useIsWishlisted(product.slug);

  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[],
    [product.variants],
  );
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[],
    [product.variants],
  );
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);

  const selectedVariant =
    product.variants.find(
      (v) =>
        (sizes.length === 0 || v.size === size) &&
        (colors.length === 0 || v.color === color),
    ) ?? product.variants[0];

  const unitPrice = selectedVariant?.priceOverrideUsd ?? product.basePriceUsd;
  const inStock = (selectedVariant?.stockQuantity ?? 0) > 0;

  const addToBag = () => {
    if (!selectedVariant) return;
    addLine({ productSlug: product.slug, variantId: selectedVariant.id, quantity });
    toast.success(`${product.name} added to your bag`);
  };

  const onToggleWishlist = () => {
    toggleWishlist(product.slug);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved to your wishlist");
  };

  const share = async () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      // User dismissed the native share sheet — no action needed
    }
  };

  return (
    <div className="flex flex-col">
      {brandName && (
        <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">{brandName}</p>
      )}
      <h1 className="mt-2 font-serif text-3xl font-medium leading-tight text-ink md:text-4xl">
        {product.name}
      </h1>

      <div className="mt-3">
        <RatingStars
          rating={product.rating}
          count={product.reviewCount}
          size="md"
          onClick={() => setReviewOpen(true)}
        />
      </div>

      <Price
        price={unitPrice}
        compareAt={product.compareAtPriceUsd}
        className="mt-4 text-xl"
      />

      <p className="mt-5 text-sm leading-relaxed text-stone">{product.description}</p>

      {colors.length > 0 && (
        <div className="mt-7">
          <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">
            Shade{color ? `: ${color}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.variants
              .filter((v) => v.color)
              .map((v) => {
                const isSelected = v.color === color;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setColor(v.color ?? null)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition",
                      isSelected
                        ? "border-ink bg-ink text-ivory"
                        : "border-line text-ink hover:border-stone",
                    )}
                  >
                    {v.colorHex && (
                      <span
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: v.colorHex }}
                        aria-hidden
                      />
                    )}
                    <span>{v.color}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-7">
          <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">
            Size{size ? `: ${size}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {sizes.map((s) => {
              const isSelected = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-[48px] rounded-md border px-3 py-2 text-xs font-medium uppercase tracking-luxe-sm transition",
                    isSelected
                      ? "border-ink bg-ink text-ivory"
                      : "border-line text-ink hover:border-stone",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
        <div className="flex-1">
          <LinedButton
            type="button"
            onClick={addToBag}
            disabled={!inStock}
            width="w-full"
          >
            {inStock ? "Add to Bag" : "Out of Stock"}
          </LinedButton>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <button
          type="button"
          onClick={onToggleWishlist}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe-sm text-stone transition hover:text-ink"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              hydrated && wishlisted && "fill-gold stroke-gold",
            )}
          />
          <span>{hydrated && wishlisted ? "Saved" : "Save to wishlist"}</span>
        </button>

        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe-sm text-stone transition hover:text-ink"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-stone">
        <li className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-stone" aria-hidden />
          <span>
            Order within 2 hours for <strong>dispatch today</strong>. Free shipping over {formatPrice(FREE_SHIPPING_THRESHOLD_USD)}
          </span>
        </li>
        <li className="flex items-center gap-3">
          <RotateCcw className="h-4 w-4 text-stone" aria-hidden />
          <span>
            <strong>Free returns</strong> within 30 days. No questions asked.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <Check className="h-4 w-4 text-stone" aria-hidden />
          <span>
            100% <strong>secure encrypted</strong> checkout.
          </span>
        </li>
        {inStock && (selectedVariant?.stockQuantity ?? 0) <= 10 && (
          <li className="flex items-center gap-3 text-ink">
            <Sparkles className="h-4 w-4 text-gold" aria-hidden />
            Low stock — only {selectedVariant?.stockQuantity} remaining
          </li>
        )}
      </ul>

      <ReviewDialog
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productName={product.name}
        productSlug={product.slug}
      />
    </div>
  );
}
