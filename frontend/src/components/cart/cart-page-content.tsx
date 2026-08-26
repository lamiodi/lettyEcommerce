"use client";

import { useState } from "react";
import { ShoppingBag, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { FreeShippingBar } from "@/components/cart/free-shipping-bar";
import { ProductCard } from "@/components/product/product-card";
import { LinedButton } from "@/components/shared/lined-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CartLineItemSkeleton,
  OrderSummarySkeleton,
  ProductCardSkeleton,
} from "@/components/shared/skeletons";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCartRecovery } from "@/hooks/use-cart-recovery";
import { cartSubtotal, detailCartLines } from "@/lib/cart-details";
import { calculateShipping } from "@/lib/constants";
import { brands } from "@/lib/mock/catalog";
import { products } from "@/lib/mock/products";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice, pluralize } from "@/lib/utils";

/** Demo promo codes — client-side only until the backend arrives. */
const COUPONS: Record<string, { rate: number; label: string }> = {
  LETY10: { rate: 0.1, label: "10% off" },
};

export function CartPageContent() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  useCartRecovery();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);

  const detailed = detailCartLines(lines);
  const subtotal = cartSubtotal(detailed);
  const discount = coupon ? subtotal * COUPONS[coupon].rate : 0;
  const shipping = calculateShipping(subtotal - discount, "standard");
  const total = Math.max(0, subtotal - discount) + shipping;

  const recommendations = products
    .filter((p) => p.isBestSeller && !lines.some((l) => l.productSlug === p.slug))
    .slice(0, 4);
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setCoupon(code);
      setCouponInput("");
      toast.success(`Promo code ${code} applied — ${COUPONS[code].label}`);
    } else {
      toast.error("Invalid promo code.");
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 md:px-8 md:py-16">
        <header className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-56 md:h-12" />
          <Skeleton className="h-3 w-20" />
        </header>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Skeleton className="h-1.5 w-full" />
            {Array.from({ length: 2 }).map((_, i) => (
              <CartLineItemSkeleton key={i} variant="page" />
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <OrderSummarySkeleton />
            </div>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-2 gap-x-4 gap-y-10 border-t border-line pt-16 md:grid-cols-4 md:gap-x-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16 space-y-10">
        <div className="flex flex-col items-center py-16 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-9 w-9 text-stone" aria-hidden strokeWidth={1.5} />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-medium text-ink">Your bag is empty</h1>
          <p className="mt-2 max-w-sm text-sm text-stone">
            Every great ritual begins with a single piece. Discover the edit chosen by our concierge.
          </p>
          <div className="mt-8 flex justify-center">
            <LinedButton href="/shop">Explore the Boutique</LinedButton>
          </div>
        </div>

        {recommendations.length > 0 && (
          <section aria-labelledby="cart-empty-recs" className="border-t border-line pt-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-xs font-medium uppercase tracking-luxe text-stone">
                Start Your Ritual
              </p>
              <h2 id="cart-empty-recs" className="font-serif text-3xl font-medium text-ink">
                Discover Current Best Sellers
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} brandName={brandNames[p.brandSlug]} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const itemCount = detailed.reduce((n, l) => n + l.quantity, 0);

  return (
    <div>
      <header>
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Your Selection</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
          Shopping Bag
        </h1>
        <p className="mt-2 text-sm text-stone">
          {itemCount} {pluralize(itemCount, "piece")}
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FreeShippingBar subtotal={subtotal - discount} />

          <ul className="mt-6 flex flex-col gap-6">
            {detailed.map((line) => (
              <li key={line.variantId}>
                <CartLineItem line={line} variant="page" />
              </li>
            ))}
          </ul>

          <form onSubmit={applyCoupon} className="mt-10 max-w-md">
            <div className="flex items-center gap-3">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                className="h-11 flex-1 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm uppercase focus-visible:ring-0 focus-visible:border-ink"
              />
              <button
                type="submit"
                className="text-[11px] font-medium uppercase tracking-luxe text-ink hover:text-stone transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
          {coupon && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink">
              <Tag className="h-3 w-3 text-stone" aria-hidden />
              {coupon} — {COUPONS[coupon].label}
              <button
                type="button"
                onClick={() => setCoupon(null)}
                aria-label={`Remove promo code ${coupon}`}
                className="text-stone transition hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            </p>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <h2 className="font-serif text-xl font-medium text-ink border-b border-line pb-4">
              Order Summary
            </h2>
            <dl className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone">Discount ({coupon})</dt>
                  <dd className="font-medium text-ink">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone">Shipping</dt>
                <dd className="font-medium text-ink">
                  {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-4">
                <dt className="text-base font-medium text-ink">Total</dt>
                <dd className="font-serif text-2xl font-medium text-ink">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-center">
              <LinedButton href="/checkout">Proceed to Checkout</LinedButton>
            </div>
            <div className="mt-3 flex justify-center">
              <LinedButton href="/shop" width="max-w-[240px]">Continue Shopping</LinedButton>
            </div>
            <p className="mt-6 text-center text-[11px] uppercase tracking-luxe text-stone">
              Taxes included. Try promo code LETTY10 for 10% off.
            </p>
          </div>
        </aside>
      </div>

      {recommendations.length > 0 && (
        <section aria-labelledby="cart-recs-heading" className="mt-20 border-t border-line pt-16">
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs font-medium uppercase tracking-luxe text-stone">
              Before You Go
            </p>
            <h2 id="cart-recs-heading" className="font-serif text-3xl font-medium text-ink">
              Pairs beautifully with
            </h2>
            <span aria-hidden className="block h-px w-24 bg-ink/30" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} brandName={brandNames[p.brandSlug]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
