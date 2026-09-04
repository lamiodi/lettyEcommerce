/**
 * POST /api/checkout/init
 * Build the order, reserve inventory, and initialize the payment gateway.
 * Returns the clientSecret (Stripe) or authorizationUrl (Paystack).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { created } from "@/lib/responses";
import { checkoutInitSchema } from "@/lib/validations";
import { buildOrder } from "@/lib/orders/orchestrator";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  // Rate limit per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const { success } = await enforceRateLimit("checkout", ip);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = checkoutInitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const result = await buildOrder({
    ...parsed.data,
    ipAddress: ip,
    userAgent,
  });

  logger.info(
    { orderId: result.orderId, gateway: result.gateway, currency: result.currency, amount: result.amount },
    "Order initialized",
  );

  return Response.json(
    {
      data: {
        order_id: result.orderId,
        order_number: result.orderNumber,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        gateway: result.gateway,
        currency: result.currency,
        amount: result.amount,
        client_secret: result.clientSecret,
        clientSecret: result.clientSecret,
        authorization_url: result.authorizationUrl,
        authorizationUrl: result.authorizationUrl,
        access_code: result.accessCode,
        accessCode: result.accessCode,
      },
    },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
