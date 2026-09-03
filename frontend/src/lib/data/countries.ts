export type CurrencyCode = "GBP" | "USD" | "EUR" | "CAD" | "NGN" | "GHS" | "ZAR" | "KES";
export type PaymentGateway = "stripe" | "paystack";

export interface CountryInfo {
  code: string;           // ISO 3166-1 alpha-2
  name: string;
  flag: string;           // Emoji flag
  currency: CurrencyCode;
  currencySymbol: string;
  dialCode: string;
  gateway: PaymentGateway;
  popular?: boolean;
}

/**
 * Exchange rates relative to GBP (£1.00 base).
 * These provide realistic, luxury-tier price conversions across all supported markets.
 */
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  GBP: 1.0,
  USD: 1.28,
  EUR: 1.17,
  CAD: 1.74,
  NGN: 2050.0,
  GHS: 19.5,
  ZAR: 23.5,
  KES: 165.0,
};

/**
 * Currencies that typically don't display cents / decimals on luxury goods.
 */
export const ZERO_DECIMAL_CURRENCIES: CurrencyCode[] = ["NGN", "KES", "GHS", "ZAR"];

export const COUNTRIES: CountryInfo[] = [
  // Pinned / Core Markets
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    dialCode: "+44",
    gateway: "stripe",
    popular: true,
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+1",
    gateway: "stripe",
    popular: true,
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+33",
    gateway: "stripe",
    popular: true,
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    currencySymbol: "₦",
    dialCode: "+234",
    gateway: "paystack",
    popular: true,
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    currencySymbol: "C$",
    dialCode: "+1",
    gateway: "stripe",
    popular: true,
  },

  // Additional European Destinations
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+49",
    gateway: "stripe",
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+39",
    gateway: "stripe",
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+34",
    gateway: "stripe",
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+31",
    gateway: "stripe",
  },
  {
    code: "BE",
    name: "Belgium",
    flag: "🇧🇪",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+32",
    gateway: "stripe",
  },
  {
    code: "IE",
    name: "Ireland",
    flag: "🇮🇪",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+353",
    gateway: "stripe",
  },
  {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+41",
    gateway: "stripe",
  },

  // Additional African Destinations
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    currencySymbol: "GH₵",
    dialCode: "+233",
    gateway: "paystack",
    popular: true,
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    currencySymbol: "R",
    dialCode: "+27",
    gateway: "paystack",
    popular: true,
  },
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    currencySymbol: "KSh",
    dialCode: "+254",
    gateway: "paystack",
  },
  {
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+20",
    gateway: "stripe",
  },
  {
    code: "MA",
    name: "Morocco",
    flag: "🇲🇦",
    currency: "EUR",
    currencySymbol: "€",
    dialCode: "+212",
    gateway: "stripe",
  },

  // Middle East & Global
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+971",
    gateway: "stripe",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+966",
    gateway: "stripe",
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currency: "USD",
    currencySymbol: "$",
    dialCode: "+61",
    gateway: "stripe",
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // United Kingdom
