/**
 * GET /api/public/exchange-rates
 *
 * Exposes authoritative live FX rates relative to GBP (£1.00 base).
 * Used by storefront and checkout so UI display prices match backend charges.
 * Fetches once every 24 hours from Frankfurter with disk persistence & fallback.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { getExchangeRates } from "@/lib/currency/fx";
import { corsHeaders } from "@/lib/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const force = req.nextUrl.searchParams.get("force") === "true";
  const result = await getExchangeRates(force);

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
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
});
