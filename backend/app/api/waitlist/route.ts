/**
 * POST /api/waitlist
 * { email, variant_id } — public sign-up to be notified when a variant restocks.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { created } from "@/lib/responses";
import { waitlistJoinSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `waitlist:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = waitlistJoinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { email, variant_id } = parsed.data;

  const { error } = await supabaseAdmin()
    .from("waitlist")
    .upsert({ email, variant_id }, { onConflict: "email,variant_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  return Response.json(
    { data: { ok: true } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
