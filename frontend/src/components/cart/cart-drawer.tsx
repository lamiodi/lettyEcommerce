"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { LinedButton } from "@/components/shared/lined-button";
import { LettyImage } from "@/components/shared/letty-image";
import { CartDrawerSkeleton } from "@/components/shared/skeletons";
import { detailCartLines, cartSubtotal } from "@/lib/cart-details";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { products } from "@/lib/mock/products";
import { formatPrice } from "@/lib/utils";
import { useCurrencyStore } from "@/lib/store/currency";
import { Price } from "@/components/shared/price";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

export function CartDrawer() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const addLine = useCartStore((s) => s.addLine);
  const { currency, convertPrice } = useCurrencyStore();

  const detailed = detailCartLines(lines);
  const subtotal = cartSubtotal(detailed);
  const convertedSubtotal = convertPrice(subtotal);

  const suggestions = products
    .filter((p) => p.isBestSeller && !lines.some((l) => l.productSlug === p.slug))
    .slice(0, 2);

  const go = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  if (!hydrated) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="flex w-full flex-col bg-ivory p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line px-6 py-5">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="font-serif text-xl text-ink">
              Shopping Bag{" "}
              <span className="text-sm font-normal text-stone">
                ({detailed.reduce((n, l) => n + l.quantity, 0)})
              </span>
            </SheetTitle>
            {detailed.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  useCartStore.getState().clear();
                  toast.success("Shopping bag cleared");
                }}
                className="group inline-flex items-center gap-1.5 text-[11px] font-serif uppercase tracking-widest text-stone hover:text-ink transition-colors cursor-pointer"
                title="Clear all items"
              >
                <Trash2 className="h-3 w-3 transition-transform group-hover:scale-110" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </SheetHeader>

        {detailed.length === 0 ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center bg-secondary">
                <ShoppingBag className="h-7 w-7 text-stone" aria-hidden strokeWidth={1.5} />
              </span>
              <div className="space-y-2">
                <p className="font-serif text-xl font-normal tracking-tight text-ink">Your Bag is Empty</p>
                <p className="mx-auto max-w-xs text-xs sm:text-sm text-stone leading-relaxed">
                  Your vanity awaits its signature touch. Explore our sculpted lip liners and luminous glass glosses crafted to elevate your daily ritual.
                </p>
              </div>
              <div className="mt-2">
                <LinedButton onClick={() => go("/shop")} width="max-w-[230px]">
                  Explore the Collection
                </LinedButton>
              </div>
            </div>
            {suggestions.length > 0 && (
              <div className="mt-auto border-t border-line px-6 py-8">
                <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-luxe text-stone">
                  Current Best Sellers
                </p>
                <div className="space-y-4">
                  {suggestions.map((p) => (
                    <div key={p.slug} className="flex items-center gap-3">
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={closeDrawer}
                        className="relative h-16 w-12 shrink-0 overflow-hidden bg-secondary"
                      >
                        <LettyImage imageKey={p.media[0].imageKey} sizes="48px" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={closeDrawer}
                          className="block truncate text-sm font-medium text-ink hover:text-stone"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-stone">{formatPrice(p.basePriceUsd)}</p>
                      </div>
                      <button
                        type="button"
                        className="text-[11px] font-medium uppercase tracking-luxe text-ink hover:text-stone transition-colors active:scale-95"
                        onClick={() =>
                          addLine({
                            productSlug: p.slug,
                            variantId: p.variants[0].id,
                            quantity: 1,
                          })
                        }
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <AnimatePresence initial={false}>
                {detailed.map((line) => (
                  <motion.div
                    key={line.variantId}
                    initial={{ opacity: 0, height: 0, scale: 0.96 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: EASE_LUXURY }}
                    className="overflow-hidden"
                  >
                    <CartLineItem line={line} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {suggestions.length > 0 && (
                <div className="border-t border-line pt-5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-luxe text-stone">
                    Pairs beautifully with
                  </p>
                  <div className="space-y-3">
                    {suggestions.map((p) => (
                      <div key={p.slug} className="flex items-center gap-3">
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={closeDrawer}
                          className="relative h-14 w-11 shrink-0 overflow-hidden bg-secondary"
                        >
                          <LettyImage imageKey={p.media[0].imageKey} sizes="56px" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/products/${p.slug}`}
                            onClick={closeDrawer}
                            className="block truncate text-sm font-medium text-ink hover:text-stone"
                          >
                            {p.name}
                          </Link>
                          <Price price={p.basePriceUsd} className="text-xs text-stone" />
                        </div>
                        <button
                          type="button"
                          className="text-[11px] font-medium uppercase tracking-luxe text-ink hover:text-stone transition-colors"
                          onClick={() =>
                            addLine({
                              productSlug: p.slug,
                              variantId: p.variants[0].id,
                              quantity: 1,
                            })
                          }
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-line bg-ivory px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-stone">Subtotal</span>
                <span className="font-serif text-xl text-ink">
                  {formatPrice(convertedSubtotal, currency)}
                </span>
              </div>
              <p className="text-xs text-stone">
                Shipping calculated at checkout.
              </p>
              <div className="flex justify-center">
                <LinedButton onClick={() => go("/checkout")} width="max-w-[260px]">
                  Proceed to Checkout
                </LinedButton>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => go("/cart")}
                  className="text-[11px] font-medium uppercase tracking-luxe text-stone hover:text-ink transition-colors"
                >
                  View Full Bag
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Re-exported for callers that want a drawer-shaped placeholder.
export { CartDrawerSkeleton };
