/**
 * Eligibility restrictions for LETTY's UK Stripe account. Stripe dynamically
 * ranks the remaining enabled methods, including local bank payment methods.
 * https://docs.stripe.com/payments/klarna#cross-border-payments
 * https://docs.stripe.com/payments/afterpay-clearpay#payment-support
 */
const UK_KLARNA_CURRENCIES: Record<string, string[]> = {
  GB: ["GBP"],
  AT: ["EUR"], BE: ["EUR"], CY: ["EUR"], DE: ["EUR"], EE: ["EUR"],
  ES: ["EUR"], FI: ["EUR"], FR: ["EUR"], GR: ["EUR"], IE: ["EUR"],
  IT: ["EUR"], LT: ["EUR"], LU: ["EUR"], LV: ["EUR"], MT: ["EUR"],
  NL: ["EUR"], PT: ["EUR"], SI: ["EUR"], SK: ["EUR"],
  DK: ["DKK", "EUR"], SE: ["SEK", "EUR"], NO: ["NOK", "EUR"],
  PL: ["PLN", "EUR"], CH: ["CHF", "EUR"], CZ: ["CZK", "EUR"], RO: ["RON", "EUR"],
};

const PAYPAL_CURRENCIES = new Set([
  "GBP", "EUR", "USD", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "SGD", "HKD", "JPY"
]);

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

  const klarnaSupportedCurrencies = UK_KLARNA_CURRENCIES[country];
  if (!klarnaSupportedCurrencies || !klarnaSupportedCurrencies.includes(currency)) {
    exclusions.push("klarna");
  }

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

