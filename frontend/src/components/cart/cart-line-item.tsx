"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LettyImage } from "@/components/shared/letty-image";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice, cn } from "@/lib/utils";
import type { CartLineDetailed } from "@/types";

interface CartLineItemProps {
  line: CartLineDetailed;
  variant?: "drawer" | "page";
}

export function CartLineItem({ line, variant = "drawer" }: CartLineItemProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const closeDrawer = useCartStore((s) => s.closeDrawer);

  const variantLabel = [line.variant.size, line.variant.color].filter(Boolean).join(" · ");
  const isPage = variant === "page";

  return (
    <div className={cn("flex gap-4", isPage && "rounded-xl border border-line bg-surface p-4")}>
      <Link
        href={`/products/${line.product.slug}`}
        onClick={closeDrawer}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-secondary",
          isPage ? "h-28 w-24" : "h-24 w-[4.5rem]",
        )}
      >
        <LettyImage imageKey={line.product.media[0].imageKey} sizes="96px" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${line.product.slug}`}
              onClick={closeDrawer}
              className="block truncate font-serif text-base text-ink transition-colors hover:text-gold"
            >
              {line.product.name}
            </Link>
            {variantLabel && (
              <p className="mt-0.5 text-xs text-stone">{variantLabel}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${line.product.name} from bag`}
            className="h-7 w-7 shrink-0 text-stone hover:text-ink"
            onClick={() => removeLine(line.variantId)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <QuantityStepper
            quantity={line.quantity}
            onChange={(q) => setQuantity(line.variantId, q)}
            size="sm"
          />
          <p className="text-sm font-medium text-ink">
            {formatPrice(line.lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
