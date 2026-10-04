/**
 * POST /api/coupon/validate
 * { code, subtotal, currency, customerId? }
 *
 * Read-only validation: does NOT increment times_used — that only happens
 * when checkout/init prices the order. Browsing the cart must never consume
 * a limited-use coupon.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { couponValidateSchema } from "@/lib/validations";
import { validateCoupon } from "@/lib/coupons/manager";
import { getAuthenticatedCustomer } from "@/lib/auth/customer";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `coupon:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { code, subtotal, currency } = parsed.data;
  // Customer identity comes from the session cookie only — a body-supplied
  // customerId would let anyone claim another patron's per-customer limits.
  const authCustomer = await getAuthenticatedCustomer();
  const result = await validateCoupon({
    code,
    subtotal,
    customerId: authCustomer?.sub,
    currency,
    apply: false,
  });
  return Response.json({ data: result }, { headers: corsHeaders(req.headers.get("origin")) });
});

