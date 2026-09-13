import { NextRequest, NextResponse } from "next/server";

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

// Fallback curated directory for common luxury & major metropolitan addresses
const FALLBACK_DIRECTORY: Record<string, AddressSuggestionItem[]> = {
  GB: [
    {
      id: "gb-1",
      streetLine: "10 Downing Street",
      city: "London",
      state: "Greater London",
      postalCode: "SW1A 2AA",
      country: "United Kingdom",
      countryCode: "GB",
      formatted: "10 Downing Street, London, SW1A 2AA, United Kingdom",
    },
    {
      id: "gb-2",
      streetLine: "170 New Bond Street",
      city: "London",
      state: "Greater London",
      postalCode: "W1S 4RN",
      country: "United Kingdom",
      countryCode: "GB",
      formatted: "170 New Bond Street, Mayfair, London, W1S 4RN, United Kingdom",
    },
    {
      id: "gb-3",
      streetLine: "14 Kings Road",
      city: "London",
      state: "Greater London",
      postalCode: "SW3 4RP",
      country: "United Kingdom",
      countryCode: "GB",
      formatted: "14 Kings Road, Chelsea, London, SW3 4RP, United Kingdom",
    },
    {
      id: "gb-4",
      streetLine: "24 George Street",
      city: "Edinburgh",
      state: "Scotland",
      postalCode: "EH2 2PF",
      country: "United Kingdom",
      countryCode: "GB",
      formatted: "24 George Street, Edinburgh, EH2 2PF, United Kingdom",
    },
    {
      id: "gb-5",
      streetLine: "72 King Street",
      city: "Manchester",
      state: "Greater Manchester",
      postalCode: "M2 4WD",
      country: "United Kingdom",
      countryCode: "GB",
      formatted: "72 King Street, Manchester, M2 4WD, United Kingdom",
    },
  ],
  US: [
    {
      id: "us-1",
      streetLine: "727 5th Avenue",
      city: "New York",
      state: "New York",
      postalCode: "10022",
      country: "United States",
      countryCode: "US",
      formatted: "727 5th Avenue, New York, NY 10022, United States",
    },
    {
      id: "us-2",
      streetLine: "300 Rodeo Drive",
      city: "Beverly Hills",
      state: "California",
      postalCode: "90210",
      country: "United States",
      countryCode: "US",
      formatted: "300 Rodeo Drive, Beverly Hills, CA 90210, United States",
    },
    {
      id: "us-3",
      streetLine: "660 N Michigan Avenue",
      city: "Chicago",
      state: "Illinois",
      postalCode: "60611",
      country: "United States",
      countryCode: "US",
      formatted: "660 N Michigan Avenue, Chicago, IL 60611, United States",
    },
    {
      id: "us-4",
      streetLine: "390 NE 39th Street",
      city: "Miami",
      state: "Florida",
      postalCode: "33137",
      country: "United States",
      countryCode: "US",
      formatted: "390 NE 39th Street, Miami, FL 33137, United States",
    },
  ],
  NG: [
    {
      id: "ng-1",
      streetLine: "14 Adeola Odeku Street",
      city: "Victoria Island",
      state: "Lagos",
      postalCode: "101241",
      country: "Nigeria",
      countryCode: "NG",
      formatted: "14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria",
    },
    {
      id: "ng-2",
      streetLine: "25 Maitama Sule Street",
      city: "Asokoro",
      state: "Abuja",
      postalCode: "900231",
      country: "Nigeria",
      countryCode: "NG",
      formatted: "25 Maitama Sule Street, Asokoro, Abuja, Nigeria",
    },
    {
      id: "ng-3",
      streetLine: "8 Gana Street",
      city: "Maitama",
      state: "Abuja",
      postalCode: "900271",
      country: "Nigeria",
      countryCode: "NG",
      formatted: "8 Gana Street, Maitama, Abuja, Nigeria",
    },
    {
      id: "ng-4",
      streetLine: "22 Admiralty Way",
      city: "Lekki Phase 1",
      state: "Lagos",
      postalCode: "105102",
      country: "Nigeria",
      countryCode: "NG",
      formatted: "22 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
    },
  ],
  FR: [
    {
      id: "fr-1",
      streetLine: "31 Rue Cambon",
      city: "Paris",
      state: "Île-de-France",
      postalCode: "75001",
      country: "France",
      countryCode: "FR",
      formatted: "31 Rue Cambon, Paris, 75001, France",
    },
    {
      id: "fr-2",
      streetLine: "24 Rue du Faubourg Saint-Honoré",
      city: "Paris",
      state: "Île-de-France",
      postalCode: "75008",
      country: "France",
      countryCode: "FR",
      formatted: "24 Rue du Faubourg Saint-Honoré, Paris, 75008, France",
    },
  ],
  CA: [
    {
      id: "ca-1",
      streetLine: "130 Bloor Street West",
      city: "Toronto",
      state: "Ontario",
      postalCode: "M5S 1N5",
      country: "Canada",
      countryCode: "CA",
      formatted: "130 Bloor Street West, Toronto, ON M5S 1N5, Canada",
    },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();
    const countryParam = (searchParams.get("country") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Derive country code
    const code =
      countryParam.length === 2
        ? countryParam.toUpperCase()
        : countryParam.toLowerCase() === "united kingdom"
        ? "GB"
        : countryParam.toLowerCase() === "united states"
        ? "US"
        : countryParam.toLowerCase() === "nigeria"
        ? "NG"
        : countryParam.toLowerCase() === "france"
        ? "FR"
        : countryParam.toLowerCase() === "canada"
        ? "CA"
        : countryParam.toUpperCase();

    try {
      const searchQuery = countryParam ? `${query}, ${countryParam}` : query;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=6&lang=en`;
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

        const suggestions: AddressSuggestionItem[] = [];
        const seen = new Set<string>();

        for (let i = 0; i < features.length; i++) {
          const p = features[i].properties;
          if (!p) continue;

          // Build clean street address line
          const houseNum = p.housenumber || "";
          const street = p.street || p.name || "";
          const streetLine = houseNum ? `${houseNum} ${street}` : street;
          const city = p.city || p.town || p.village || p.district || "";
          const state = p.state || p.county || "";
          const postalCode = p.postcode || "";
          const country = p.country || countryParam || "";
          const countryCode = (p.countrycode || code || "").toUpperCase();

          if (!streetLine || !city) continue;

          const uniqueKey = `${streetLine.toLowerCase()}|${city.toLowerCase()}|${postalCode.toLowerCase()}`;
          if (seen.has(uniqueKey)) continue;
          seen.add(uniqueKey);

          const parts = [streetLine, city, state, postalCode, country].filter(Boolean);
          const formatted = parts.join(", ");

          suggestions.push({
            id: `photon-${p.osm_id || i}`,
            streetLine,
            city,
            state,
            postalCode,
            country,
            countryCode,
            formatted,
          });
        }

        if (suggestions.length > 0) {
          return NextResponse.json({ suggestions });
        }
      }
    } catch {
      // Remote fetch failed or aborted; proceed to fallback
    }

    // Graceful fallback to matching local directory items
    const fallbacksForCountry = FALLBACK_DIRECTORY[code] || Object.values(FALLBACK_DIRECTORY).flat();
    const lowerQ = query.toLowerCase();
    const matchedFallbacks = fallbacksForCountry.filter(
      (item) =>
        item.streetLine.toLowerCase().includes(lowerQ) ||
        item.city.toLowerCase().includes(lowerQ) ||
        item.formatted.toLowerCase().includes(lowerQ) ||
        lowerQ.length <= 3
    );

    return NextResponse.json({ suggestions: matchedFallbacks.slice(0, 5) });
  } catch (error) {
    console.error("Address suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
