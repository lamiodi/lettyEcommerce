"use client";

import { useMemo, useState } from "react";
import { Check, Heart, RotateCcw, Share2, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import { LinedButton } from "@/components/shared/lined-button";
import { Price } from "@/components/shared/price";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { RatingStars } from "@/components/shared/rating-stars";
import { useCartStore } from "@/lib/store/cart";
import { useIsWishlisted, useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
        <RatingStars rating={product.rating} count={product.reviewCount} size="md" />
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
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setColor(v.color!)}
                  aria-label={`Select shade ${v.color}`}
                  aria-pressed={color === v.color}
                  title={v.color}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition",
                    color === v.color
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-ivory"
                      : "ring-1 ring-line hover:ring-stone",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: v.colorHex ?? "#ccc" }}
                  />
                </button>
              ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-7">
          <p className="text-[11px] font-medium uppercase tracking-luxe text-stone">Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const variant = product.variants.find(
                (v) => v.size === s && (colors.length === 0 || v.color === color),
              );
              const available = (variant?.stockQuantity ?? 0) > 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  disabled={!available}
                  className={cn(
                    "h-10 min-w-16 border px-4 text-sm transition",
                    size === s
                      ? "border-ink bg-ink text-ivory"
                      : "border-line bg-transparent text-ink hover:border-stone",
                    !available && "cursor-not-allowed opacity-40 line-through",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-stretch gap-3">
        <QuantityStepper
          quantity={quantity}
          onChange={setQuantity}
          max={Math.max(1, selectedVariant?.stockQuantity ?? 99)}
          className="bg-transparent border border-line"
        />
        <div className="flex-1 flex justify-center">
          <LinedButton
            onClick={addToBag}
            type="button"
            width="max-w-[240px]"
            className={!inStock ? "opacity-50 pointer-events-none" : ""}
          >
            {inStock ? "Add to Bag" : "Out of Stock"}
          </LinedButton>
        </div>
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={hydrated && wishlisted}
          className="flex h-10 w-10 items-center justify-center border border-line bg-transparent text-ink transition hover:border-stone"
        >
          <Heart className={cn("h-4 w-4", hydrated && wishlisted && "fill-ink")} />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Share this product"
          className="flex h-10 w-10 items-center justify-center border border-line bg-transparent text-ink transition hover:border-stone"
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-stone">
        <li className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-stone" aria-hidden />
          <span>
            Order within 2 hours for <strong>dispatch today</strong>. Free shipping over {`$${FREE_SHIPPING_THRESHOLD_USD}`}
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
            <Check className="h-4 w-4 text-stone" aria-hidden />
            Low stock — only {selectedVariant?.stockQuantity} remaining
          </li>
        )}
      </ul>
    </div>
  );
}
