/**
 * POST /api/customer/auth/forgot-password
 *
 * Creates a single-use, 30-minute reset token and emails the link.
 * Always answers 200 with the same body — the response never reveals
 * whether the email has an account (anti-enumeration).
 */
import { NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/cors";
import { clientIp } from "@/lib/utils/client-ip";

const schema = z.object({ email: z.string().email() });
const TOKEN_TTL_MS = 30 * 60 * 1000;

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

  // Opportunistic cleanup of long-expired tokens.
  void supabaseAdmin()
    .from("password_reset_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id, first_name, password_hash, is_active")
    .eq("email", email)
    .maybeSingle();

  // Guest records (no password yet) and deactivated accounts get no email.
  if (customer?.id && customer.password_hash && customer.is_active) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error } = await supabaseAdmin().from("password_reset_tokens").insert({
      customer_id: customer.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    });

    if (error) {
      logger.error({ error }, "password reset token insert failed");
    } else {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
      const resetUrl = `${siteUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
      const tpl = passwordResetEmail({
        customerName: customer.first_name ?? undefined,
        resetUrl,
        siteUrl,
      });
      void sendEmail({
        priority: "critical",
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [{ name: "type", value: "password_reset" }],
      });
    }
  }

  return ok({ ok: true }, { headers: corsHeaders(origin) });
});

export const OPTIONS = (req: NextRequest) =>
  new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
