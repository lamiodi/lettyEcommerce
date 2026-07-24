/**
 * POST /api/giftcard/validate
 * { code, currency }
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { giftCardValidateSchema } from "@/lib/validations";
import { validateGiftCard } from "@/lib/giftcards/manager";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `giftcard:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = giftCardValidateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { code, currency } = parsed.data;
  const result = await validateGiftCard(code, currency);
  return Response.json({ data: result }, { headers: corsHeaders(req.headers.get("origin")) });
});
