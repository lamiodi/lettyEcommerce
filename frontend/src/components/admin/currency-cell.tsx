/**
 * CurrencyCell — formats a number into the right currency using the
 * brand's `formatPrice` helper. Used in admin tables so every column
 * stays consistent without each call site knowing the symbol.
 */
import { formatPrice } from "@/lib/utils";

export type AdminCurrency = "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES";

interface CurrencyCellProps {
  amount: number | string | null | undefined;
  currency: AdminCurrency;
  className?: string;
  /** Render dimmer when amount is 0 (e.g. "—" for free shipping). */
  zeroDisplay?: string;
}

export function CurrencyCell({ amount, currency, className = "", zeroDisplay }: CurrencyCellProps) {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  if (n === 0 && zeroDisplay) {
    return <span className={`text-stone ${className}`}>{zeroDisplay}</span>;
  }
  return <span className={`tabular-nums ${className}`}>{formatPrice(n, currency)}</span>;
}
