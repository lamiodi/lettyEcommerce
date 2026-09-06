"use client";

import { Truck, ShieldCheck } from "lucide-react";
import { useCurrencyStore } from "@/lib/store/currency";
import { getShippingDestinationKey, SHIPPING_DESTINATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FreeShippingBar({ subtotal: _subtotal }: { subtotal?: number }) {
  const { country, currency, convertPrice } = useCurrencyStore();
  const destKey = getShippingDestinationKey(country?.code || country?.name);
  const dest = SHIPPING_DESTINATIONS[destKey] ?? SHIPPING_DESTINATIONS.UK;

  const gbpRate = Number(dest.gbpRate ?? dest.flatGbp ?? 4.99);
  const eurRate =
    dest.eurRate != null
      ? Number(dest.eurRate)
      : dest.flatEur != null
      ? Number(dest.flatEur)
      : undefined;
  const estimate = dest.deliveryTime || dest.estimate || "2–3 Business Days";

  let formattedFee = `£${gbpRate.toFixed(2)}`;
  if (currency === "EUR" && eurRate !== undefined) {
    formattedFee = `€${eurRate.toFixed(2)}`;
  } else if (currency === "GBP") {
    formattedFee = `£${gbpRate.toFixed(2)}`;
  } else {
    const converted = typeof convertPrice === "function" ? convertPrice(gbpRate) : gbpRate;
    const safeConverted = Number(converted) || gbpRate;
    formattedFee = `${currency || "GBP"} ${safeConverted.toFixed(2)}`;
  }

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
            {dest.flag || "🇬🇧"} {dest.label || "UK"} Tracked Delivery
          </span>
        </span>
        <span className="font-serif font-semibold text-ink text-sm">
          {formattedFee}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone">
        <ShieldCheck className="h-3 w-3 text-gold/80 shrink-0" aria-hidden />
        <span>Flat rate · Tracked &amp; insured dispatch ({estimate})</span>
      </p>
    </div>
  );
}
