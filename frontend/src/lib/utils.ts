import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  GBP: "en-GB",
  EUR: "fr-FR",
  NGN: "en-NG",
  GHS: "en-GH",
  ZAR: "en-ZA",
  KES: "en-KE",
  CAD: "en-CA",
}

/** Format a numeric amount as a localized currency string (defaults to GBP). */
export function formatPrice(amount: number, currency = "GBP"): string {
  const locale = CURRENCY_LOCALES[currency] ?? "en-US"
  const cacheKey = `${locale}:${currency}:${amount % 1 === 0}`
  let formatter = currencyFormatters.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    })
    currencyFormatters.set(cacheKey, formatter)
  }
  return formatter.format(amount)
}

/** Pluralize a noun based on count. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
