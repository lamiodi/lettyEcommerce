/**
 * Eligibility restrictions for LETTY's UK Stripe account. Stripe dynamically
 * ranks the remaining enabled methods, including local bank payment methods.
 * https://docs.stripe.com/payments/klarna#cross-border-payments
 * https://docs.stripe.com/payments/afterpay-clearpay#payment-support
 */
const UK_KLARNA_CURRENCIES: Record<string, string> = {
  GB: "GBP", AT: "EUR", BE: "EUR", FI: "EUR", FR: "EUR", DE: "EUR",
  GR: "EUR", IE: "EUR", IT: "EUR", NL: "EUR", PT: "EUR", ES: "EUR",
};
const PAYPAL_CURRENCIES = new Set(["GBP", "EUR", "USD", "CAD"]);

/** Stripe forbids a positive maxRows together with overflow: "never". */
export function getExpressCheckoutLayout(desktop: boolean) {
  return { maxColumns: desktop ? 4 : 1, overflow: "never" as const };
}

export function getCheckoutPaymentExclusions(country: string, currency: string): string[] {
  const exclusions = ["amazon_pay"];
  if (UK_KLARNA_CURRENCIES[country] !== currency) exclusions.push("klarna");
  // Afterpay/Clearpay requires a domestic transaction for a UK merchant.
  if (country !== "GB" || currency !== "GBP") exclusions.push("afterpay_clearpay");
  if (!PAYPAL_CURRENCIES.has(currency)) exclusions.push("paypal");
  return exclusions;
}
