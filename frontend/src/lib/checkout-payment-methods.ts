/**
 * Eligibility restrictions for LETTY's UK Stripe account. Stripe dynamically
 * ranks the remaining enabled methods, including local bank payment methods.
 * https://docs.stripe.com/payments/klarna#cross-border-payments
 * https://docs.stripe.com/payments/afterpay-clearpay#payment-support
 */
const PAYPAL_CURRENCIES = new Set([
  "GBP", "EUR", "USD", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "SGD", "HKD", "JPY"
]);

const AFTERPAY_SUPPORTED_COUNTRIES = new Set(["GB", "US", "CA", "AU", "NZ"]);

export function getExpressCheckoutLayout(desktop: boolean) {
  return {
    maxColumns: desktop ? 4 : 1,
    maxRows: desktop ? 1 : 4,
    overflow: "auto" as const,
  };
}

/**
 * Returns localized copy for Klarna payment method:
 * - "Pay in 4 interest-free installments" in US, CA, AU, NZ
 * - "Pay in 3 interest-free instalments" in UK, Europe, and other regions
 */
export function getKlarnaBrandName(country: string): {
  label: "Klarna";
  hint: string;
} {
  const isPayIn4 = ["US", "CA", "AU", "NZ"].includes(country);
  return {
    label: "Klarna",
    hint: isPayIn4
      ? "Pay in 4 interest-free installments"
      : "Pay in 3 interest-free instalments",
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

  // Klarna is supported and shown for all regions.

  // Afterpay (US, CA, AU, NZ) and Clearpay (GB) are fully supported via
  // Stripe's Cross-Border Trade program on UK Stripe merchant accounts.
  if (!AFTERPAY_SUPPORTED_COUNTRIES.has(country)) {
    exclusions.push("afterpay_clearpay");
  }

  if (!PAYPAL_CURRENCIES.has(currency)) {
    exclusions.push("paypal");
  }

  return exclusions;
}

