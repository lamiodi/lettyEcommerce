/**
 * Payment gateway router.
 * Picks Stripe for international currencies, Paystack for Africa.
 */
import type { Currency } from "@/lib/validations";

export type Gateway = "stripe" | "paystack";

const PAYSTACK_CURRENCIES: ReadonlySet<Currency> = new Set(["NGN", "GHS", "ZAR", "KES"]);
const STRIPE_CURRENCIES: ReadonlySet<Currency> = new Set(["USD", "EUR", "GBP"]);

export function selectGateway(currency: Currency): Gateway {
  if (PAYSTACK_CURRENCIES.has(currency)) return "paystack";
  if (STRIPE_CURRENCIES.has(currency)) return "stripe";
  throw new Error(`No payment gateway configured for ${currency}`);
}

export function isStripeCurrency(c: Currency): boolean {
  return STRIPE_CURRENCIES.has(c);
}

export function isPaystackCurrency(c: Currency): boolean {
  return PAYSTACK_CURRENCIES.has(c);
}

