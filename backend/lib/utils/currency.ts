/**
 * Currency formatting, conversion, and validation helpers.
 *
 * - We DO NOT perform live FX conversion in the backend; we store amounts in
 *   the order's currency, and we only display converted prices for analytics
 *   or as a convenience. The actual charge is always made in `order.currency`.
 */
import { SUPPORTED_CURRENCIES, type Currency } from "@/lib/validations";

export function isSupportedCurrency(c: string): c is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c);
}

/** Symbol for a given currency code. Falls back to the code itself. */
export function currencySymbol(c: Currency): string {
  switch (c) {
    case "USD":
    case "CAD":
    case "AUD":
    case "SGD":
    case "HKD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "NGN":
      return "₦";
    case "GHS":
      return "₵";
    case "ZAR":
      return "R";
    case "KES":
      return "KSh";
    default:
      return c;
  }
}

/** Locale used for Intl.NumberFormat. */
export function currencyLocale(c: Currency): string {
  switch (c) {
    case "USD":
      return "en-US";
    case "EUR":
      return "en-IE";
    case "GBP":
      return "en-GB";
    case "NGN":
      return "en-NG";
    case "GHS":
      return "en-GH";
    case "ZAR":
      return "en-ZA";
    case "KES":
      return "en-KE";
    default:
      return "en-US";
  }
}

/**
 * Format an integer-cents amount as a localized currency string.
 * Most payment APIs (Stripe, Paystack) require the smallest currency unit.
 */
export function formatMoney(amount: number, c: Currency): string {
  return new Intl.NumberFormat(currencyLocale(c), {
    style: "currency",
    currency: c,
    minimumFractionDigits: c === "NGN" || c === "KES" ? 0 : 2,
  }).format(amount);
}

/** Convert major units (e.g. 19.99) to the smallest currency unit (1999). */
export function toMinorUnits(amount: number, c: Currency): number {
  // JPY-style currencies without minor units are not in our list, so always *100.
  return Math.round(amount * 100);
}

/** Convert smallest currency unit back to major units. */
export function fromMinorUnits(minor: number, _c: Currency): number {
  return minor / 100;
}
