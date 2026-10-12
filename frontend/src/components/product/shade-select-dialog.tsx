"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LettyImage } from "@/components/shared/letty-image";
import { Price } from "@/components/shared/price";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface ShadeSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  brandName?: string;
  /** Variant the card had highlighted when the dialog was opened. */
  defaultVariantId?: string;
}

/**
 * Shade picker opened from a product card's "Select Shade" button — shows
 * the product with a live image preview per shade; picking a shade adds
 * that variant straight to the bag.
 */
export function ShadeSelectDialog({
  isOpen,
  onClose,
  product,
  brandName,
  defaultVariantId,
}: ShadeSelectDialogProps) {
  const [hoveredVariant, setHoveredVariant] = useState<ProductVariant | null>(null);
  const addLine = useCartStore((s) => s.addLine);

  const shadeVariants = product.variants.filter((v) => v.color);
  const defaultVariant =
    product.variants.find((v) => v.id === defaultVariantId) ?? shadeVariants[0];
  const activeVariant = hoveredVariant ?? defaultVariant;

  const activeImageKey =
    activeVariant?.image || activeVariant?.images?.[0] || product.media[0]?.imageKey;

  const activePrice = activeVariant?.priceOverrideUsd ?? product.basePriceUsd;

  const chooseShade = (variant: ProductVariant) => {
    if (variant.stockQuantity <= 0) return;
    addLine({ productSlug: product.slug, variantId: variant.id, quantity: 1 });
    toast.success(
      `${product.name}${variant.color ? ` (${variant.color})` : ""} added to your bag`,
    );
    setHoveredVariant(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Select shade — ${product.name}`}
            className="relative z-10 w-full max-w-md overflow-y-auto max-h-[90vh] rounded-none border border-line bg-ivory p-6 sm:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shade selector"
              className="absolute right-4 top-4 text-stone transition-colors hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-5">
              {activeImageKey && (
                <div className="w-20 shrink-0 sm:w-24">
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    <LettyImage
                      key={`shade-${activeImageKey}`}
                      imageKey={activeImageKey}
                      alt={
                        activeVariant?.color
                          ? `${product.name} — ${activeVariant.color}`
                          : product.name
                      }
                      sizes="96px"
                      className="transition-all duration-500"
                    />
                  </div>
                </div>
              )}

              <div className="min-w-0 pt-1 pr-6">
                {brandName && (
                  <p className="text-[0.65rem] font-medium uppercase tracking-luxe text-stone">
                    {brandName}
                  </p>
                )}
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Select Shade
                </p>
                <h2 className="mt-1 font-serif text-xl font-medium leading-snug text-ink sm:text-2xl">
                  {product.name}
                </h2>
                <Price
                  price={activePrice}
                  compareAt={product.compareAtPriceUsd}
                  className="mt-1.5 text-[15px] font-medium tracking-tight text-ink"
                />
              </div>
            </div>

            <hr className="my-5 border-line" />

            <p className="text-xs font-medium uppercase tracking-luxe text-stone">
              {shadeVariants.length} {shadeVariants.length === 1 ? "Shade" : "Shades"}
            </p>

            <div
              className="mt-3 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Available shades"
            >
              {shadeVariants.map((v) => {
                const soldOut = v.stockQuantity <= 0;
                const isActive = activeVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={
                      soldOut ? `${v.color} — sold out` : `Select shade ${v.color}`
                    }
                    disabled={soldOut}
                    onMouseEnter={() => setHoveredVariant(v)}
                    onMouseLeave={() => setHoveredVariant(null)}
                    onClick={() => chooseShade(v)}
                    className="group flex flex-col items-center gap-1.5 outline-none"
                  >
                    <span
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
                        isActive
                          ? "border-ink ring-1 ring-ink ring-offset-2 ring-offset-ivory"
                          : "border-line group-enabled:group-hover:border-stone",
                        soldOut && "opacity-40",
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-ink/10"
                        style={v.colorHex ? { backgroundColor: v.colorHex } : undefined}
                      />
                      {soldOut && (
                        <span className="absolute h-[1px] w-[130%] rotate-[-45deg] bg-stone" />
                      )}
                    </span>
                    <span className="max-w-[72px] truncate text-center text-[10px] font-medium uppercase tracking-luxe-sm text-stone transition-colors group-enabled:group-hover:text-ink">
                      {v.color}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[10px] uppercase tracking-luxe-sm text-stone">
              Choosing a shade adds it to your bag
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
