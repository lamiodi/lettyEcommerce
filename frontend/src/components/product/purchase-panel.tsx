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
import { cn, formatPrice } from "@/lib/utils";
import { LettyImage } from "@/components/shared/letty-image";
import type { Product, ProductVariant } from "@/types";

interface PurchasePanelProps {
  product: Product;
  brandName?: string;
  onVariantChange?: (variant: ProductVariant) => void;
}

/** Sticky PDP purchase panel — variants, quantity, bag, wishlist, share. */
export function PurchasePanel({ product, brandName, onVariantChange }: PurchasePanelProps) {
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
      <div className="flex items-center justify-between gap-2">
        {brandName ? (
          <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">{brandName}</p>
        ) : <span />}
        {product.isVegan && (
          <span className="inline-flex items-center rounded-full border border-line bg-secondary/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-luxe text-stone">
            Vegan Formula
          </span>
        )}
      </div>
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
                    onClick={() => {
                      setColor(v.color ?? null);
                      if (onVariantChange) onVariantChange(v);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition",
                      isSelected
                        ? "border-ink bg-ink text-ivory"
                        : "border-line bg-transparent text-ink hover:border-stone",
                    )}
                  >
                    {v.colorHex && (
                      <span
                        className="h-3 w-3 rounded-full border border-line"
                        style={{ backgroundColor: v.colorHex }}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isSelected = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    const matchingVariant = product.variants.find(
                      (v) => v.size === s && (colors.length === 0 || v.color === color),
                    ) ?? product.variants.find((v) => v.size === s);
                    if (matchingVariant && onVariantChange) {
                      onVariantChange(matchingVariant);
                    }
                  }}
                  className={cn(
                    "min-w-[48px] rounded-md border px-3 py-2 text-xs font-medium uppercase tracking-luxe-sm transition",
                    isSelected
                      ? "border-ink bg-ink text-ivory"
                      : "border-line bg-transparent text-ink hover:border-stone",
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
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={selectedVariant ? Math.max(1, selectedVariant.stockQuantity) : 10}
        />
        <LinedButton
          onClick={addToBag}
          disabled={!inStock}
          className="flex-1"
        >
          {inStock ? "Add to bag" : "Out of stock"}
        </LinedButton>
      </div>

      <div className="mt-6 flex items-center gap-6">
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
          <span>{hydrated && wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}</span>
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

      {product.pairWith && (
        <div className="mt-7 overflow-hidden rounded-xl border border-line bg-secondary/30 p-4 transition hover:border-stone/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-luxe text-[#8C6D32]">
              Complete The Lip Combo
            </span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold text-ivory">
              Recommended Pair
            </span>
          </div>
          <div className="mt-3.5 flex items-center gap-3.5">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <LettyImage
                imageKey={product.pairWith.image}
                alt={product.pairWith.name}
                fill
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">
                {product.pairWith.name}
              </p>
              <p className="text-[11px] text-stone">
                Shade: {product.pairWith.shade}
              </p>
              <p className="mt-1 font-serif text-xs font-semibold text-ink">
                {formatPrice(product.pairWith.priceGbp, "GBP")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (product.pairWith) {
                  addLine({
                    productSlug: product.pairWith.slug,
                    variantId: `v-${product.pairWith.slug}-default`,
                    quantity: 1,
                  });
                  toast.success(`Added ${product.pairWith.name} to your bag`);
                }
              }}
              className="shrink-0 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-medium text-ivory transition hover:bg-ink/80"
            >
              + Add Duo
            </button>
          </div>
        </div>
      )}

      <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-stone">
        <li className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-stone" aria-hidden />
          <span>
            Order within 2 hours for <strong>same-day dispatch</strong>. UK &amp; international delivery available.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <RotateCcw className="h-4 w-4 text-stone" aria-hidden />
          <span>
            <strong>Complimentary returns &amp; exchanges</strong> on eligible orders.
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
