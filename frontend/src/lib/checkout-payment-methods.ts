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
const AFTERPAY_SUPPORTED_COUNTRIES = new Set(["GB", "US", "CA", "AU", "NZ"]);

export function getExpressCheckoutLayout(desktop: boolean) {
  return {
    maxColumns: desktop ? 4 : 1,
    maxRows: desktop ? 1 : 3,
    overflow: "auto" as const,
  };
}

/**
 * Returns the localized brand name for Block's BNPL service:
 * - "Clearpay" in the UK (GB)
 * - "Afterpay" in the US (US), Canada (CA), Australia (AU), New Zealand (NZ), etc.
 */
export function getAfterpayBrandName(country: string): {
  label: "Clearpay" | "Afterpay";
  hint: string;
} {
  const isClearpay = country === "GB";
  return {
    label: isClearpay ? "Clearpay" : "Afterpay",
    hint: isClearpay
      ? "Pay in 4 interest-free instalments"
      : "Pay in 4 interest-free installments",
  };
}

export function getCheckoutPaymentExclusions(country: string, currency: string): string[] {
  const exclusions = ["amazon_pay"];
  if (UK_KLARNA_CURRENCIES[country] !== currency) exclusions.push("klarna");
  // Afterpay/Clearpay for a UK Stripe merchant requires GBP currency,
  // supported across UK (Clearpay) and cross-border US/CA/AU/NZ (Afterpay).
  if (!AFTERPAY_SUPPORTED_COUNTRIES.has(country) || currency !== "GBP") {
    exclusions.push("afterpay_clearpay");
  }
  if (!PAYPAL_CURRENCIES.has(currency)) exclusions.push("paypal");
  return exclusions;
}
