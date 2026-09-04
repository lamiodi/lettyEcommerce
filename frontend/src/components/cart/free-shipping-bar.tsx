"use client";

import { Sparkles, Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_USD) * 100);
  const unlocked = remaining === 0;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 transition-all duration-300",
        unlocked
          ? "bg-secondary border border-gold/40 shadow-xs"
          : "bg-secondary border border-transparent",
      )}
    >
      <p className="flex items-center gap-2 text-xs text-ink">
        {unlocked ? (
          <Sparkles className="h-4 w-4 text-gold shrink-0 animate-pulse" aria-hidden />
        ) : (
          <Truck className="h-4 w-4 text-gold shrink-0" aria-hidden />
        )}
        {unlocked ? (
          <span className="font-medium text-ink">
            🎉 <strong className="text-[#8C6D32]">Complimentary express shipping</strong> unlocked!
          </span>
        ) : (
          <span>
            You&rsquo;re <strong className="text-ink">{formatPrice(remaining)}</strong> away from{" "}
            <strong>complimentary express shipping</strong>
          </span>
        )}
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to free shipping"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            unlocked
              ? "bg-gradient-to-r from-gold via-[#E5C158] to-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]"
              : "bg-gold",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

