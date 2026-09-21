/**
 * POST /api/newsletter
 * { email, source? }
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { newsletterSubscribeSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/resend";
import { newsletterWelcomeEmail } from "@/lib/email/templates";
import { corsHeaders } from "@/lib/cors";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `newsletter:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = newsletterSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  const { email, source } = parsed.data;
  await supabaseAdmin()
    .from("newsletter_subscribers")
    .upsert(
      { email, source: source ?? "website", is_subscribed: true, unsubscribed_at: null },
      { onConflict: "email" },
    );

  // Fire-and-forget subscriber welcome (distinct from the customer welcome:
  // subscribers have not purchased, so purchase-gated promises don't apply).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  const welcome = newsletterWelcomeEmail({ siteUrl });
  void sendEmail({ to: email, subject: welcome.subject, html: welcome.html, text: welcome.text });

  return Response.json(
    { data: { ok: true } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
