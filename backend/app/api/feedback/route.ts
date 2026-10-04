/**
 * POST /api/feedback
 *
 * Records a satisfaction-survey rating (0–10). The /feedback page posts
 * here after an explicit confirm click — a page GET alone never writes,
 * so email-prefetch bots (Gmail/Outlook) cannot fabricate ratings.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

const schema = z.object({
  score: z.number().int().min(0).max(10),
  order_number: z.string().trim().min(1).max(32).optional(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";
  const { success } = await enforceRateLimit("auth", `feedback:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid feedback submission", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const { error } = await supabaseAdmin().from("feedback_ratings").insert({
    score: parsed.data.score,
    order_number: parsed.data.order_number ?? null,
  });
  if (error) {
    return Response.json(
      { error: "Could not record your feedback. Please try again." },
      { status: 500, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  return ok({ recorded: true }, { headers: corsHeaders(req.headers.get("origin")) });
});

export const OPTIONS = async (req: NextRequest) => {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
};
