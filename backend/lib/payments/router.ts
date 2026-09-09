/**
 * Payment gateway router.
 * Routes payments to Stripe.
 */
import type { Currency } from "@/lib/validations";

export type Gateway = "stripe";

export function selectGateway(_currency: Currency): Gateway {
  return "stripe";
}

export function isStripeCurrency(_c: Currency): boolean {
  return true;
}

