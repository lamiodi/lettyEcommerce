"use client";

import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_USD) * 100);

  return (
    <div className="rounded-lg bg-secondary px-4 py-3">
      <p className="flex items-center gap-2 text-xs text-ink">
        <Truck className="h-4 w-4 text-gold" aria-hidden />
        {remaining > 0 ? (
          <span>
            You&rsquo;re <strong>{formatPrice(remaining)}</strong> away from
            complimentary express shipping
          </span>
        ) : (
          <span>
            <strong>Complimentary express shipping</strong> unlocked
          </span>
        )}
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to free shipping"
      >
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
