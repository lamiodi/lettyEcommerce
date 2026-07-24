/**
 * GET /api/cart/recover?token=...
 *
 * Resolves an abandoned cart's recovery token to the saved cart contents.
 * The frontend (when it lands on /cart?ref=xxx) calls this to hydrate the
 * Zustand store with the saved items, then clears the ?ref= param.
 *
 * Tokens are 32-byte hex; rate-limited per IP to prevent enumeration.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit, RateLimitError } from "@/lib/ratelimit";
import { corsHeaders } from "@/lib/cors";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  token: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const { success } = await enforceRateLimit("public", `cart-recover:${ip}`);
  if (!success) throw new RateLimitError();

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ token: url.searchParams.get("token") ?? "" });
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid recovery token" },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("abandoned_carts")
    .select("cart, currency, customer_email")
    .eq("recovery_token", parsed.data.token)
    .is("recovered_at", null)
    .maybeSingle();
  if (error) {
    logger.error({ error }, "cart-recover: lookup failed");
    return Response.json(
      { error: "Lookup failed" },
      { status: 500, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  if (!data) {
    return Response.json(
      { data: { cart: null } },
      { status: 200, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  return Response.json(
    {
      data: {
        cart: data.cart,
        currency: data.currency,
        customer_email: data.customer_email,
      },
    },
    { headers: corsHeaders(req.headers.get("origin")) },
  );
});
