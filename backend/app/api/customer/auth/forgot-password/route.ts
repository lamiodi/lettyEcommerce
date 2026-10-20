/**
 * POST /api/customer/auth/forgot-password
 *
 * Creates a single-use, 30-minute reset token and emails the link.
 * Always answers 200 with the same body — the response never reveals
 * whether the email has an account (anti-enumeration).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { sendPasswordLink } from "@/lib/auth/password-link";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { clientIp } from "@/lib/utils/client-ip";

const schema = z.object({ email: z.string().trim().email() });

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const ip =
    clientIp(req);
  const { success } = await enforceRateLimit("auth", `forgot-password:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Same neutral answer as a miss — no format probing either.
    return ok({ ok: true }, { headers: corsHeaders(origin) });
  }
  const email = parsed.data.email.toLowerCase().trim();

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id, first_name, password_hash, is_active")
    .eq("email", email)
    .maybeSingle();

  if (customer?.id && customer.is_active) {
    try {
      const sent = await sendPasswordLink({ id: customer.id, email, firstName: customer.first_name ?? undefined }, !customer.password_hash);
      if (!sent) logger.error("Password link was not accepted by the email provider");
    } catch (err) {
      logger.error({ err }, "Password link could not be prepared");
    }
  }

  return ok({ ok: true }, { headers: corsHeaders(origin) });
});

export const OPTIONS = (req: NextRequest) =>
  new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
