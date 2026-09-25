/**
 * GET /api/public/shipping-quote?country=GB&currency=GBP&subtotal=13.99
 *
 * Authoritative shipping rate for a destination/currency, mirroring exactly
 * what /api/checkout/init will charge for shipping. The storefront's express
 * wallet uses this when the payment sheet asks for a delivery address so the
 * wallet total cannot drift from the backend charge when rates are edited in
 * the dashboard (shipping_zones / shipping_methods).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { calculateShipping } from "@/lib/shipping/calculator";
import { corsHeaders } from "@/lib/cors";
import type { Currency } from "@/lib/validations";

export const GET = asyncHandler(async (req: NextRequest) => {
  const country = (req.nextUrl.searchParams.get("country") ?? "GB").trim().slice(0, 56);
  const currencyRaw = (req.nextUrl.searchParams.get("currency") ?? "GBP").toUpperCase();
  const currency = (["GBP", "USD", "EUR", "CAD", "NGN", "GHS", "ZAR", "KES"] as const).includes(
    currencyRaw as Currency,
  )
    ? (currencyRaw as Currency)
    : "GBP";
  const subtotal = Math.max(0, Number(req.nextUrl.searchParams.get("subtotal")) || 0);

  const quote = await calculateShipping({ country, subtotal, currency });

  return Response.json(
    {
      data: {
        rate: quote.rate,
        methodName: quote.methodName,
        estimatedDays: quote.estimatedDays ?? null,
        freeApplied: quote.freeApplied,
      },
    },
    { headers: corsHeaders(req.headers.get("origin")) },
  );
});
