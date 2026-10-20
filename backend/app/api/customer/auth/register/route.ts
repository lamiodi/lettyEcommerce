/** Registration proves email ownership before any password or session is issued. */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPasswordLink } from "@/lib/auth/password-link";
import { corsHeaders } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { clientIp } from "@/lib/utils/client-ip";
import { logger } from "@/lib/logger";

const schema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
});
export const POST = asyncHandler(async (req: NextRequest) => {
  const headers = corsHeaders(req.headers.get("origin"));
  const { success } = await enforceRateLimit("auth", `customer-register:${clientIp(req)}`);
  if (!success) throw new RateLimitError();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please enter a valid email and name." }, { status: 400, headers });
  const email = parsed.data.email.toLowerCase();
  const { data: existing, error: lookupError } = await supabaseAdmin().from("customers")
    .select("id, password_hash, first_name, is_active").eq("email", email).maybeSingle();
  if (lookupError) return Response.json({ error: "Account service is unavailable. Please try again." }, { status: 503, headers });
  if (existing?.password_hash || (existing && !existing.is_active)) {
    return Response.json({ error: "An account with this email already exists. Please sign in or request a password link." }, { status: 409, headers });
  }
  let customerId: string | undefined = existing?.id;
  if (!customerId) {
    const { data: created, error } = await supabaseAdmin().from("customers").insert({
      email, password_hash: null, first_name: parsed.data.firstName ?? null,
      last_name: parsed.data.lastName ?? null, marketing_consent: false, is_active: true,
    }).select("id").single();
    if (error || !created) return Response.json({ error: "Could not create the account request. Please try again." }, { status: 503, headers });
    customerId = created.id;
  }
  try {
    const sent = await sendPasswordLink({ id: customerId!, email,
      firstName: existing?.first_name || parsed.data.firstName,
    }, true);
    if (!sent) throw new Error("Account setup email was not accepted");
  } catch (err) {
    logger.error({ err }, "Account setup email failed");
    return Response.json({ error: "We could not send your account setup link. Please try again." }, { status: 503, headers });
  }
  return Response.json({ data: { requiresVerification: true,
    message: "Check your email to confirm your address and choose your password. The link works once and expires in 30 minutes.",
  } }, { status: 201, headers });
});
export const OPTIONS = (req: NextRequest) => new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
