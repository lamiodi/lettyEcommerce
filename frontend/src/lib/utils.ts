import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

/** Format a numeric amount as a localized currency string (defaults to USD). */
export function formatPrice(amount: number, currency = "USD"): string {
  let formatter = currencyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    })
    currencyFormatters.set(currency, formatter)
  }
  return formatter.format(amount)
}

/** Pluralize a noun based on count. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
