"use client";

import { Truck, ShieldCheck } from "lucide-react";
import { useCurrencyStore } from "@/lib/store/currency";
import { getShippingDestinationKey, SHIPPING_DESTINATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FreeShippingBar({ subtotal: _subtotal }: { subtotal?: number }) {
  const { country, currency, convertPrice } = useCurrencyStore();
  const destKey = getShippingDestinationKey(country?.code || country?.name);
  const dest = SHIPPING_DESTINATIONS[destKey];

  const formattedFee =
    currency === "EUR" && dest.flatEur !== undefined
      ? `€${dest.flatEur.toFixed(2)}`
      : currency === "GBP"
      ? `£${dest.flatGbp.toFixed(2)}`
      : `${currency} ${convertPrice(dest.flatGbp).toFixed(2)}`;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 bg-secondary/80 border border-line/60 transition-all duration-300",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2 text-ink font-medium">
          <Truck className="h-4 w-4 text-gold shrink-0" aria-hidden />
          <span>
            {dest.flag} {dest.label} Tracked Delivery
          </span>
        </span>
        <span className="font-serif font-semibold text-ink text-sm">
          {formattedFee}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone">
        <ShieldCheck className="h-3 w-3 text-gold/80 shrink-0" aria-hidden />
        <span>Flat rate · Tracked &amp; insured dispatch ({dest.estimate})</span>
      </p>
    </div>
  );
}

