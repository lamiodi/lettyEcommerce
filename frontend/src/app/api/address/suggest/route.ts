import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/data/countries";

export interface AddressSuggestionItem {
  id: string;
  streetLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  formatted: string;
}

// Full name → ISO-3166 alpha-2 lookup from the storefront's country list,
// with the common aliases shoppers' browsers may autofill.
const NAME_TO_CODE = new Map<string, string>(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code.toUpperCase()]),
);
for (const [alias, code] of [
  ["united states of america", "US"],
  ["usa", "US"],
  ["uk", "GB"],
  ["great britain", "GB"],
  ["england", "GB"],
  ["scotland", "GB"],
  ["wales", "GB"],
  ["northern ireland", "GB"],
] as const) {
  if (!NAME_TO_CODE.has(alias)) NAME_TO_CODE.set(alias, code);
}

function resolveCountryCode(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^[a-z]{2}$/i.test(v)) return v.toUpperCase();
  return NAME_TO_CODE.get(v.toLowerCase()) ?? "";
}

// Photon properties → suggestion item, or null when the feature is not a
// usable street address (POIs, landmarks, settlements, street without a
// house number, missing city, etc.).
function toSuggestion(
  p: Record<string, unknown> & {
    housenumber?: string;
    street?: string;
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    state?: string;
    county?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number | string;
  },
  strictCountry: string,
  index: number,
  requireHouseNumber: boolean,
): AddressSuggestionItem | null {
  // Strict country gate: never suggest addresses outside the selected
  // destination country.
  if (strictCountry && (p.countrycode || "").toUpperCase() !== strictCountry) {
    return null;
  }

  const city = p.city || p.town || p.village || p.district || "";
  // Address-level results only: a real house number on a real street. The
  // `name` fallback would let shops and landmarks through, so it is only
  // considered in the relaxed (street-level) pass.
  const street = requireHouseNumber
    ? p.housenumber && p.street
      ? `${p.housenumber} ${p.street}`
      : ""
    : p.street || "";

  if (!street || !city) return null;

  const postalCode = p.postcode || "";
  const state = p.state || p.county || "";
  const country = p.country || "";
  const countryCode = (p.countrycode || strictCountry || "").toUpperCase();

  return {
    id: `photon-${p.osm_id ?? index}`,
    streetLine: street,
    city,
    state,
    postalCode,
    country,
    countryCode,
    formatted: [street, city, state, postalCode, country].filter(Boolean).join(", "),
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();
    const countryParam = (searchParams.get("country") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const strictCountry = resolveCountryCode(countryParam);
    const searchQuery = countryParam ? `${query}, ${countryParam}` : query;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      // Request extra candidates so the address-level filter below can still
      // fill the list after dropping POIs, districts and unmatched countries.
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=12&lang=en`;
      const res = await fetch(photonUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "LettyEcommerce/1.0",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];

        const collect = (requireHouseNumber: boolean) => {
          const suggestions: AddressSuggestionItem[] = [];
          const seen = new Set<string>();
          for (let i = 0; i < features.length; i++) {
            const p = features[i]?.properties;
            if (!p) continue;
            const item = toSuggestion(p, strictCountry, i, requireHouseNumber);
            if (!item) continue;
            const uniqueKey = `${item.streetLine.toLowerCase()}|${item.city.toLowerCase()}|${item.postalCode.toLowerCase()}`;
            if (seen.has(uniqueKey)) continue;
            seen.add(uniqueKey);
            suggestions.push(item);
          }
          return suggestions;
        };

        // Pass 1 keeps only complete street addresses (house number + street).
        // Pass 2, used only when no house-numbered result exists (sparse OSM
        // coverage in some countries), relaxes to street-level matches.
        const suggestions = collect(true);
        if (suggestions.length > 0) {
          return NextResponse.json({ suggestions: suggestions.slice(0, 6) });
        }
        const streetLevel = collect(false);
        if (streetLevel.length > 0) {
          return NextResponse.json({ suggestions: streetLevel.slice(0, 6) });
        }
      }
    } catch {
      // Remote fetch failed or aborted; return no suggestions — the shopper
      // types their address manually rather than seeing inaccurate guesses.
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error("Address suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
