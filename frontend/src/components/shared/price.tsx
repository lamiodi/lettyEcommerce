"use client";

import { cn, formatPrice } from "@/lib/utils";
import { useCurrencyStore } from "@/lib/store/currency";
import { useHydrated } from "@/hooks/use-hydrated";
import type { CurrencyCode } from "@/lib/data/countries";

interface PriceProps {
  price: number;
  compareAt?: number;
  currency?: string;
  className?: string;
}

export function Price({ price, compareAt, currency, className }: PriceProps) {
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const convertPrice = useCurrencyStore((s) => s.convertPrice);
  const hydrated = useHydrated();

  const effectiveCurrency = currency ?? (hydrated ? activeCurrency : "GBP");
  const displayPrice = currency
    ? price
    : hydrated
    ? convertPrice(price, effectiveCurrency as CurrencyCode)
    : price;

  const displayCompareAt =
    compareAt != null
      ? currency
        ? compareAt
        : hydrated
        ? convertPrice(compareAt, effectiveCurrency as CurrencyCode)
        : compareAt
      : undefined;

  const onSale = displayCompareAt != null && displayCompareAt > displayPrice;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-medium", onSale && "text-[#8E2A2B]")}>
        {formatPrice(displayPrice, effectiveCurrency)}
      </span>
      {onSale && displayCompareAt != null && (
        <span className="text-sm text-stone line-through">
          {formatPrice(displayCompareAt, effectiveCurrency)}
        </span>
      )}
    </span>
  );
}
