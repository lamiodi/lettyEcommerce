/**
 * POST /api/customer/auth/reset-password
 *
 * { token, password } — consumes the single-use token created by
 * forgot-password and sets the new password. The token is burned before
 * the password write (fail-closed: a replay can never succeed twice).
 */
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";
import { clientIp } from "@/lib/utils/client-ip";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const INVALID = "This reset link is invalid or has expired. Please request a new one.";

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const ip =
    clientIp(req);
  const { success } = await enforceRateLimit("auth", `reset-password:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: reset } = await supabaseAdmin()
    .from("password_reset_tokens")
    .select("id, customer_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!reset || reset.used_at || new Date(reset.expires_at).getTime() <= Date.now()) {
    return Response.json({ error: INVALID }, { status: 400, headers: corsHeaders(origin) });
  }

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id, is_active")
    .eq("id", reset.customer_id)
    .maybeSingle();

  if (!customer || !customer.is_active) {
    return Response.json({ error: INVALID }, { status: 400, headers: corsHeaders(origin) });
  }

  // Burn the token first — a failed password write then costs a new request
  // instead of leaving a replayable token behind.
  const { error: burnError } = await supabaseAdmin()
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", reset.id)
    .is("used_at", null);
  if (burnError) {
    return Response.json({ error: INVALID }, { status: 400, headers: corsHeaders(origin) });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error: updateError } = await supabaseAdmin()
    .from("customers")
    .update({ password_hash: passwordHash })
    .eq("id", customer.id);

  if (updateError) {
    return Response.json(
      { error: "Could not update the password. Please try again." },
      { status: 500, headers: corsHeaders(origin) },
    );
  }

  return ok({ ok: true }, { headers: corsHeaders(origin) });
});

export const OPTIONS = (req: NextRequest) =>
  new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
