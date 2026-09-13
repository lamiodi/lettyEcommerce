export type CurrencyCode = "GBP" | "USD" | "EUR" | "CAD" | "NGN" | "GHS" | "ZAR" | "KES";
export type PaymentGateway = "stripe";

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
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+44",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "FR",
    "name": "France",
    "flag": "🇫🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+33",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flag": "🇳🇬",
    "currency": "NGN",
    "currencySymbol": "₦",
    "dialCode": "+234",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "CA",
    "name": "Canada",
    "flag": "🇨🇦",
    "currency": "CAD",
    "currencySymbol": "C$",
    "dialCode": "+1",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "DE",
    "name": "Germany",
    "flag": "🇩🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+49",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "IT",
    "name": "Italy",
    "flag": "🇮🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+39",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "ES",
    "name": "Spain",
    "flag": "🇪🇸",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+34",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "flag": "🇳🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+31",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "BE",
    "name": "Belgium",
    "flag": "🇧🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+32",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "IE",
    "name": "Ireland",
    "flag": "🇮🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+353",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "flag": "🇨🇭",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+41",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flag": "🇬🇭",
    "currency": "GHS",
    "currencySymbol": "GH₵",
    "dialCode": "+233",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "flag": "🇿🇦",
    "currency": "ZAR",
    "currencySymbol": "R",
    "dialCode": "+27",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪",
    "currency": "KES",
    "currencySymbol": "KSh",
    "dialCode": "+254",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "flag": "🇦🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+971",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "flag": "🇸🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+966",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "AU",
    "name": "Australia",
    "flag": "🇦🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+61",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "IN",
    "name": "India",
    "flag": "🇮🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+91",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "BR",
    "name": "Brazil",
    "flag": "🇧🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+55",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "MX",
    "name": "Mexico",
    "flag": "🇲🇽",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+52",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "JP",
    "name": "Japan",
    "flag": "🇯🇵",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+81",
    "gateway": "stripe",
    "popular": true
  },
  {
    "code": "AF",
    "name": "Afghanistan",
    "flag": "🇦🇫",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+93",
    "gateway": "stripe"
  },
  {
    "code": "AX",
    "name": "Åland Islands",
    "flag": "🇦🇽",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+358",
    "gateway": "stripe"
  },
  {
    "code": "AL",
    "name": "Albania",
    "flag": "🇦🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+355",
    "gateway": "stripe"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "flag": "🇩🇿",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+213",
    "gateway": "stripe"
  },
  {
    "code": "AS",
    "name": "American Samoa",
    "flag": "🇦🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1684",
    "gateway": "stripe"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flag": "🇦🇩",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+376",
    "gateway": "stripe"
  },
  {
    "code": "AO",
    "name": "Angola",
    "flag": "🇦🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+244",
    "gateway": "stripe"
  },
  {
    "code": "AI",
    "name": "Anguilla",
    "flag": "🇦🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1264",
    "gateway": "stripe"
  },
  {
    "code": "AQ",
    "name": "Antarctica",
    "flag": "🇦🇶",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+672",
    "gateway": "stripe"
  },
  {
    "code": "AG",
    "name": "Antigua and Barbuda",
    "flag": "🇦🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1268",
    "gateway": "stripe"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flag": "🇦🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+54",
    "gateway": "stripe"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flag": "🇦🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+374",
    "gateway": "stripe"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "flag": "🇦🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+297",
    "gateway": "stripe"
  },
  {
    "code": "AT",
    "name": "Austria",
    "flag": "🇦🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+43",
    "gateway": "stripe"
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "flag": "🇦🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+994",
    "gateway": "stripe"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flag": "🇧🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1242",
    "gateway": "stripe"
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "flag": "🇧🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+973",
    "gateway": "stripe"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "flag": "🇧🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+880",
    "gateway": "stripe"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flag": "🇧🇧",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1246",
    "gateway": "stripe"
  },
  {
    "code": "BY",
    "name": "Belarus",
    "flag": "🇧🇾",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+375",
    "gateway": "stripe"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "flag": "🇧🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+501",
    "gateway": "stripe"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "flag": "🇧🇯",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+229",
    "gateway": "stripe"
  },
  {
    "code": "BM",
    "name": "Bermuda",
    "flag": "🇧🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1441",
    "gateway": "stripe"
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "flag": "🇧🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+975",
    "gateway": "stripe"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flag": "🇧🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+591",
    "gateway": "stripe"
  },
  {
    "code": "BA",
    "name": "Bosnia and Herzegovina",
    "flag": "🇧🇦",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+387",
    "gateway": "stripe"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "flag": "🇧🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+267",
    "gateway": "stripe"
  },
  {
    "code": "BV",
    "name": "Bouvet Island",
    "flag": "🇧🇻",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+47",
    "gateway": "stripe"
  },
  {
    "code": "IO",
    "name": "British Indian Ocean Territory",
    "flag": "🇮🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+246",
    "gateway": "stripe"
  },
  {
    "code": "VG",
    "name": "British Virgin Islands",
    "flag": "🇻🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1284",
    "gateway": "stripe"
  },
  {
    "code": "BN",
    "name": "Brunei",
    "flag": "🇧🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+673",
    "gateway": "stripe"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flag": "🇧🇬",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+359",
    "gateway": "stripe"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "flag": "🇧🇫",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+226",
    "gateway": "stripe"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "flag": "🇧🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+257",
    "gateway": "stripe"
  },
  {
    "code": "CV",
    "name": "Cabo Verde",
    "flag": "🇨🇻",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+238",
    "gateway": "stripe"
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "flag": "🇰🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+855",
    "gateway": "stripe"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "flag": "🇨🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+237",
    "gateway": "stripe"
  },
  {
    "code": "KY",
    "name": "Cayman Islands",
    "flag": "🇰🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1345",
    "gateway": "stripe"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "flag": "🇨🇫",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+236",
    "gateway": "stripe"
  },
  {
    "code": "TD",
    "name": "Chad",
    "flag": "🇹🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+235",
    "gateway": "stripe"
  },
  {
    "code": "CL",
    "name": "Chile",
    "flag": "🇨🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+56",
    "gateway": "stripe"
  },
  {
    "code": "CN",
    "name": "China",
    "flag": "🇨🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+86",
    "gateway": "stripe"
  },
  {
    "code": "CX",
    "name": "Christmas Island",
    "flag": "🇨🇽",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+61",
    "gateway": "stripe"
  },
  {
    "code": "CC",
    "name": "Cocos (Keeling) Islands",
    "flag": "🇨🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+61",
    "gateway": "stripe"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flag": "🇨🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+57",
    "gateway": "stripe"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "flag": "🇰🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+269",
    "gateway": "stripe"
  },
  {
    "code": "CG",
    "name": "Congo (Brazzaville)",
    "flag": "🇨🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+242",
    "gateway": "stripe"
  },
  {
    "code": "CD",
    "name": "Congo (Kinshasa)",
    "flag": "🇨🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+243",
    "gateway": "stripe"
  },
  {
    "code": "CK",
    "name": "Cook Islands",
    "flag": "🇨🇰",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+682",
    "gateway": "stripe"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "flag": "🇨🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+506",
    "gateway": "stripe"
  },
  {
    "code": "CI",
    "name": "Côte d'Ivoire",
    "flag": "🇨🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+225",
    "gateway": "stripe"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "flag": "🇭🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+385",
    "gateway": "stripe"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flag": "🇨🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+53",
    "gateway": "stripe"
  },
  {
    "code": "CW",
    "name": "Curaçao",
    "flag": "🇨🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+599",
    "gateway": "stripe"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "flag": "🇨🇾",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+357",
    "gateway": "stripe"
  },
  {
    "code": "CZ",
    "name": "Czech Republic",
    "flag": "🇨🇿",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+420",
    "gateway": "stripe"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "flag": "🇩🇰",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+45",
    "gateway": "stripe"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "flag": "🇩🇯",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+253",
    "gateway": "stripe"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flag": "🇩🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1767",
    "gateway": "stripe"
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "flag": "🇩🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1809",
    "gateway": "stripe"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flag": "🇪🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+593",
    "gateway": "stripe"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "flag": "🇪🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+20",
    "gateway": "stripe"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flag": "🇸🇻",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+503",
    "gateway": "stripe"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+240",
    "gateway": "stripe"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "flag": "🇪🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+291",
    "gateway": "stripe"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flag": "🇪🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+372",
    "gateway": "stripe"
  },
  {
    "code": "SZ",
    "name": "Eswatini",
    "flag": "🇸🇿",
    "currency": "ZAR",
    "currencySymbol": "R",
    "dialCode": "+268",
    "gateway": "stripe"
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+251",
    "gateway": "stripe"
  },
  {
    "code": "FK",
    "name": "Falkland Islands",
    "flag": "🇫🇰",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+500",
    "gateway": "stripe"
  },
  {
    "code": "FO",
    "name": "Faroe Islands",
    "flag": "🇫🇴",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+298",
    "gateway": "stripe"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "flag": "🇫🇯",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+679",
    "gateway": "stripe"
  },
  {
    "code": "FI",
    "name": "Finland",
    "flag": "🇫🇮",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+358",
    "gateway": "stripe"
  },
  {
    "code": "GF",
    "name": "French Guiana",
    "flag": "🇬🇫",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+594",
    "gateway": "stripe"
  },
  {
    "code": "PF",
    "name": "French Polynesia",
    "flag": "🇵🇫",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+689",
    "gateway": "stripe"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "flag": "🇬🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+241",
    "gateway": "stripe"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "flag": "🇬🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+220",
    "gateway": "stripe"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flag": "🇬🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+995",
    "gateway": "stripe"
  },
  {
    "code": "GI",
    "name": "Gibraltar",
    "flag": "🇬🇮",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+350",
    "gateway": "stripe"
  },
  {
    "code": "GR",
    "name": "Greece",
    "flag": "🇬🇷",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+30",
    "gateway": "stripe"
  },
  {
    "code": "GL",
    "name": "Greenland",
    "flag": "🇬🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+299",
    "gateway": "stripe"
  },
  {
    "code": "GD",
    "name": "Grenada",
    "flag": "🇬🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1473",
    "gateway": "stripe"
  },
  {
    "code": "GP",
    "name": "Guadeloupe",
    "flag": "🇬🇵",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+590",
    "gateway": "stripe"
  },
  {
    "code": "GU",
    "name": "Guam",
    "flag": "🇬🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1671",
    "gateway": "stripe"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flag": "🇬🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+502",
    "gateway": "stripe"
  },
  {
    "code": "GG",
    "name": "Guernsey",
    "flag": "🇬🇬",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+44",
    "gateway": "stripe"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "flag": "🇬🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+224",
    "gateway": "stripe"
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "flag": "🇬🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+245",
    "gateway": "stripe"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flag": "🇬🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+592",
    "gateway": "stripe"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "flag": "🇭🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+509",
    "gateway": "stripe"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flag": "🇭🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+504",
    "gateway": "stripe"
  },
  {
    "code": "HK",
    "name": "Hong Kong",
    "flag": "🇭🇰",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+852",
    "gateway": "stripe"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "flag": "🇭🇺",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+36",
    "gateway": "stripe"
  },
  {
    "code": "IS",
    "name": "Iceland",
    "flag": "🇮🇸",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+354",
    "gateway": "stripe"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flag": "🇮🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+62",
    "gateway": "stripe"
  },
  {
    "code": "IR",
    "name": "Iran",
    "flag": "🇮🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+98",
    "gateway": "stripe"
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "flag": "🇮🇶",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+964",
    "gateway": "stripe"
  },
  {
    "code": "IM",
    "name": "Isle of Man",
    "flag": "🇮🇲",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+44",
    "gateway": "stripe"
  },
  {
    "code": "IL",
    "name": "Israel",
    "flag": "🇮🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+972",
    "gateway": "stripe"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flag": "🇯🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1876",
    "gateway": "stripe"
  },
  {
    "code": "JE",
    "name": "Jersey",
    "flag": "🇯🇪",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+44",
    "gateway": "stripe"
  },
  {
    "code": "JO",
    "name": "Jordan",
    "flag": "🇯🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+962",
    "gateway": "stripe"
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+7",
    "gateway": "stripe"
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "flag": "🇰🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+686",
    "gateway": "stripe"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flag": "🇰🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+965",
    "gateway": "stripe"
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+996",
    "gateway": "stripe"
  },
  {
    "code": "LA",
    "name": "Laos",
    "flag": "🇱🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+856",
    "gateway": "stripe"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "flag": "🇱🇻",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+371",
    "gateway": "stripe"
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "flag": "🇱🇧",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+961",
    "gateway": "stripe"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "flag": "🇱🇸",
    "currency": "ZAR",
    "currencySymbol": "R",
    "dialCode": "+266",
    "gateway": "stripe"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "flag": "🇱🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+231",
    "gateway": "stripe"
  },
  {
    "code": "LY",
    "name": "Libya",
    "flag": "🇱🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+218",
    "gateway": "stripe"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flag": "🇱🇮",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+423",
    "gateway": "stripe"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "flag": "🇱🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+370",
    "gateway": "stripe"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "flag": "🇱🇺",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+352",
    "gateway": "stripe"
  },
  {
    "code": "MO",
    "name": "Macao",
    "flag": "🇲🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+853",
    "gateway": "stripe"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "flag": "🇲🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+261",
    "gateway": "stripe"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "flag": "🇲🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+265",
    "gateway": "stripe"
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "flag": "🇲🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+60",
    "gateway": "stripe"
  },
  {
    "code": "MV",
    "name": "Maldives",
    "flag": "🇲🇻",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+960",
    "gateway": "stripe"
  },
  {
    "code": "ML",
    "name": "Mali",
    "flag": "🇲🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+223",
    "gateway": "stripe"
  },
  {
    "code": "MT",
    "name": "Malta",
    "flag": "🇲🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+356",
    "gateway": "stripe"
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "flag": "🇲🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+692",
    "gateway": "stripe"
  },
  {
    "code": "MQ",
    "name": "Martinique",
    "flag": "🇲🇶",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+596",
    "gateway": "stripe"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "flag": "🇲🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+222",
    "gateway": "stripe"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "flag": "🇲🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+230",
    "gateway": "stripe"
  },
  {
    "code": "YT",
    "name": "Mayotte",
    "flag": "🇾🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+262",
    "gateway": "stripe"
  },
  {
    "code": "FM",
    "name": "Micronesia",
    "flag": "🇫🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+691",
    "gateway": "stripe"
  },
  {
    "code": "MD",
    "name": "Moldova",
    "flag": "🇲🇩",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+373",
    "gateway": "stripe"
  },
  {
    "code": "MC",
    "name": "Monaco",
    "flag": "🇲🇨",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+377",
    "gateway": "stripe"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flag": "🇲🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+976",
    "gateway": "stripe"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flag": "🇲🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+382",
    "gateway": "stripe"
  },
  {
    "code": "MS",
    "name": "Montserrat",
    "flag": "🇲🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1664",
    "gateway": "stripe"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "flag": "🇲🇦",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+212",
    "gateway": "stripe"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flag": "🇲🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+258",
    "gateway": "stripe"
  },
  {
    "code": "MM",
    "name": "Myanmar",
    "flag": "🇲🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+95",
    "gateway": "stripe"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flag": "🇳🇦",
    "currency": "ZAR",
    "currencySymbol": "R",
    "dialCode": "+264",
    "gateway": "stripe"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "flag": "🇳🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+674",
    "gateway": "stripe"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flag": "🇳🇵",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+977",
    "gateway": "stripe"
  },
  {
    "code": "NC",
    "name": "New Caledonia",
    "flag": "🇳🇨",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+687",
    "gateway": "stripe"
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "flag": "🇳🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+64",
    "gateway": "stripe"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flag": "🇳🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+505",
    "gateway": "stripe"
  },
  {
    "code": "NE",
    "name": "Niger",
    "flag": "🇳🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+227",
    "gateway": "stripe"
  },
  {
    "code": "KP",
    "name": "North Korea",
    "flag": "🇰🇵",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+850",
    "gateway": "stripe"
  },
  {
    "code": "MK",
    "name": "North Macedonia",
    "flag": "🇲🇰",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+389",
    "gateway": "stripe"
  },
  {
    "code": "MP",
    "name": "Northern Mariana Islands",
    "flag": "🇲🇵",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1670",
    "gateway": "stripe"
  },
  {
    "code": "NO",
    "name": "Norway",
    "flag": "🇳🇴",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+47",
    "gateway": "stripe"
  },
  {
    "code": "OM",
    "name": "Oman",
    "flag": "🇴🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+968",
    "gateway": "stripe"
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "flag": "🇵🇰",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+92",
    "gateway": "stripe"
  },
  {
    "code": "PW",
    "name": "Palau",
    "flag": "🇵🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+680",
    "gateway": "stripe"
  },
  {
    "code": "PS",
    "name": "Palestine",
    "flag": "🇵🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+970",
    "gateway": "stripe"
  },
  {
    "code": "PA",
    "name": "Panama",
    "flag": "🇵🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+507",
    "gateway": "stripe"
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+675",
    "gateway": "stripe"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flag": "🇵🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+595",
    "gateway": "stripe"
  },
  {
    "code": "PE",
    "name": "Peru",
    "flag": "🇵🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+51",
    "gateway": "stripe"
  },
  {
    "code": "PH",
    "name": "Philippines",
    "flag": "🇵🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+63",
    "gateway": "stripe"
  },
  {
    "code": "PN",
    "name": "Pitcairn",
    "flag": "🇵🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+64",
    "gateway": "stripe"
  },
  {
    "code": "PL",
    "name": "Poland",
    "flag": "🇵🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+48",
    "gateway": "stripe"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flag": "🇵🇹",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+351",
    "gateway": "stripe"
  },
  {
    "code": "PR",
    "name": "Puerto Rico",
    "flag": "🇵🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1787",
    "gateway": "stripe"
  },
  {
    "code": "QA",
    "name": "Qatar",
    "flag": "🇶🇦",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+974",
    "gateway": "stripe"
  },
  {
    "code": "RE",
    "name": "Réunion",
    "flag": "🇷🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+262",
    "gateway": "stripe"
  },
  {
    "code": "RO",
    "name": "Romania",
    "flag": "🇷🇴",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+40",
    "gateway": "stripe"
  },
  {
    "code": "RU",
    "name": "Russia",
    "flag": "🇷🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+7",
    "gateway": "stripe"
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "flag": "🇷🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+250",
    "gateway": "stripe"
  },
  {
    "code": "BL",
    "name": "Saint Barthélemy",
    "flag": "🇧🇱",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+590",
    "gateway": "stripe"
  },
  {
    "code": "SH",
    "name": "Saint Helena",
    "flag": "🇸🇭",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+290",
    "gateway": "stripe"
  },
  {
    "code": "KN",
    "name": "Saint Kitts and Nevis",
    "flag": "🇰🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1869",
    "gateway": "stripe"
  },
  {
    "code": "LC",
    "name": "Saint Lucia",
    "flag": "🇱🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1758",
    "gateway": "stripe"
  },
  {
    "code": "MF",
    "name": "Saint Martin",
    "flag": "🇲🇫",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+590",
    "gateway": "stripe"
  },
  {
    "code": "PM",
    "name": "Saint Pierre and Miquelon",
    "flag": "🇵🇲",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+508",
    "gateway": "stripe"
  },
  {
    "code": "VC",
    "name": "Saint Vincent and the Grenadines",
    "flag": "🇻🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1784",
    "gateway": "stripe"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flag": "🇼🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+685",
    "gateway": "stripe"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flag": "🇸🇲",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+378",
    "gateway": "stripe"
  },
  {
    "code": "ST",
    "name": "Sao Tome and Principe",
    "flag": "🇸🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+239",
    "gateway": "stripe"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flag": "🇸🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+221",
    "gateway": "stripe"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flag": "🇷🇸",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+381",
    "gateway": "stripe"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "flag": "🇸🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+248",
    "gateway": "stripe"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "flag": "🇸🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+232",
    "gateway": "stripe"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "flag": "🇸🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+65",
    "gateway": "stripe"
  },
  {
    "code": "SX",
    "name": "Sint Maarten",
    "flag": "🇸🇽",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1721",
    "gateway": "stripe"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "flag": "🇸🇰",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+421",
    "gateway": "stripe"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "flag": "🇸🇮",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+386",
    "gateway": "stripe"
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "flag": "🇸🇧",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+677",
    "gateway": "stripe"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "flag": "🇸🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+252",
    "gateway": "stripe"
  },
  {
    "code": "GS",
    "name": "South Georgia",
    "flag": "🇬🇸",
    "currency": "GBP",
    "currencySymbol": "£",
    "dialCode": "+500",
    "gateway": "stripe"
  },
  {
    "code": "KR",
    "name": "South Korea",
    "flag": "🇰🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+82",
    "gateway": "stripe"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "flag": "🇸🇸",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+211",
    "gateway": "stripe"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flag": "🇱🇰",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+94",
    "gateway": "stripe"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "flag": "🇸🇩",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+249",
    "gateway": "stripe"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "flag": "🇸🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+597",
    "gateway": "stripe"
  },
  {
    "code": "SJ",
    "name": "Svalbard and Jan Mayen",
    "flag": "🇸🇯",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+47",
    "gateway": "stripe"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "flag": "🇸🇪",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+46",
    "gateway": "stripe"
  },
  {
    "code": "SY",
    "name": "Syria",
    "flag": "🇸🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+963",
    "gateway": "stripe"
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "flag": "🇹🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+886",
    "gateway": "stripe"
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "flag": "🇹🇯",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+992",
    "gateway": "stripe"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flag": "🇹🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+255",
    "gateway": "stripe"
  },
  {
    "code": "TH",
    "name": "Thailand",
    "flag": "🇹🇭",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+66",
    "gateway": "stripe"
  },
  {
    "code": "TL",
    "name": "Timor-Leste",
    "flag": "🇹🇱",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+670",
    "gateway": "stripe"
  },
  {
    "code": "TG",
    "name": "Togo",
    "flag": "🇹🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+228",
    "gateway": "stripe"
  },
  {
    "code": "TK",
    "name": "Tokelau",
    "flag": "🇹🇰",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+690",
    "gateway": "stripe"
  },
  {
    "code": "TO",
    "name": "Tonga",
    "flag": "🇹🇴",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+676",
    "gateway": "stripe"
  },
  {
    "code": "TT",
    "name": "Trinidad and Tobago",
    "flag": "🇹🇹",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1868",
    "gateway": "stripe"
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "flag": "🇹🇳",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+216",
    "gateway": "stripe"
  },
  {
    "code": "TR",
    "name": "Turkey",
    "flag": "🇹🇷",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+90",
    "gateway": "stripe"
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "flag": "🇹🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+993",
    "gateway": "stripe"
  },
  {
    "code": "TC",
    "name": "Turks and Caicos Islands",
    "flag": "🇹🇨",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1649",
    "gateway": "stripe"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "flag": "🇹🇻",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+688",
    "gateway": "stripe"
  },
  {
    "code": "VI",
    "name": "U.S. Virgin Islands",
    "flag": "🇻🇮",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+1340",
    "gateway": "stripe"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flag": "🇺🇬",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+256",
    "gateway": "stripe"
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "flag": "🇺🇦",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+380",
    "gateway": "stripe"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flag": "🇺🇾",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+598",
    "gateway": "stripe"
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "flag": "🇺🇿",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+998",
    "gateway": "stripe"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "flag": "🇻🇺",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+678",
    "gateway": "stripe"
  },
  {
    "code": "VA",
    "name": "Vatican City",
    "flag": "🇻🇦",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+39",
    "gateway": "stripe"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flag": "🇻🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+58",
    "gateway": "stripe"
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flag": "🇻🇳",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+84",
    "gateway": "stripe"
  },
  {
    "code": "WF",
    "name": "Wallis and Futuna",
    "flag": "🇼🇫",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+681",
    "gateway": "stripe"
  },
  {
    "code": "EH",
    "name": "Western Sahara",
    "flag": "🇪🇭",
    "currency": "EUR",
    "currencySymbol": "€",
    "dialCode": "+212",
    "gateway": "stripe"
  },
  {
    "code": "YE",
    "name": "Yemen",
    "flag": "🇾🇪",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+967",
    "gateway": "stripe"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "flag": "🇿🇲",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+260",
    "gateway": "stripe"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "flag": "🇿🇼",
    "currency": "USD",
    "currencySymbol": "$",
    "dialCode": "+263",
    "gateway": "stripe"
  }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // United Kingdom
