/**
 * GET /api/public/exchange-rates
 *
 * Exposes authoritative live FX rates relative to GBP (£1.00 base).
 * Used by storefront and checkout so UI display prices match backend charges.
 * Fetches once every 24 hours from Frankfurter with disk persistence & fallback.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { getExchangeRates, fetchLiveMarketRates } from "@/lib/currency/fx";
import { corsHeaders } from "@/lib/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const live = req.nextUrl.searchParams.get("live") === "true";
  const force = req.nextUrl.searchParams.get("force") === "true";

  if (live) {
    const liveRates = await fetchLiveMarketRates();
    return Response.json(
      {
        data: {
          base: "GBP",
          rates: liveRates,
          updated_at: new Date().toISOString(),
          source: "frankfurter",
        },
      },
      {
        status: 200,
        headers: {
          ...corsHeaders(req.headers.get("origin")),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  const result = await getExchangeRates(force);

  // If using admin_fixed or force refreshed, do not keep long public cache
  const cacheHeader =
    force || result.source === "admin_fixed"
      ? "no-store, no-cache, must-revalidate"
      : "public, s-maxage=3600, stale-while-revalidate=86400";

  return Response.json(
    {
      data: {
        base: result.base,
        rates: result.rates,
        updated_at: result.updatedAt,
        source: result.source,
      },
    },
    {
      status: 200,
      headers: {
        ...corsHeaders(req.headers.get("origin")),
        "Cache-Control": cacheHeader,
      },
    },
  );
});
