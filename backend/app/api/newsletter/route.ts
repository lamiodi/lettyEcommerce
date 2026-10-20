/**
 * POST /api/newsletter
 * { email, source? }
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { newsletterSubscribeSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { AppError, RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/resend";
import { newsletterWelcomeEmail } from "@/lib/email/templates";
import { corsHeaders } from "@/lib/cors";
import { clientIp } from "@/lib/utils/client-ip";
import { createUnsubscribeUrl } from "@/lib/email/preferences";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    clientIp(req);
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

  const { source } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  // INSERT ... DO NOTHING and the conditional resubscribe UPDATE each select
  // only the row they changed. Concurrent popup/footer submits welcome once.
  const { data: inserted, error: saveError } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .upsert(
      { email, source: source ?? "website", is_subscribed: true, unsubscribed_at: null },
      { onConflict: "email", ignoreDuplicates: true },
    ).select("id");
  if (saveError) {
    logger.error({ error: saveError }, "newsletter: subscription was not saved");
    throw new AppError("We couldn’t subscribe you. Please try again.", 503, "subscription_unavailable");
  }

  let shouldWelcome = Boolean(inserted?.length);
  if (!shouldWelcome) {
    const { data: restored, error: restoreError } = await supabaseAdmin().from("newsletter_subscribers")
      .update({ source: source ?? "website", is_subscribed: true, unsubscribed_at: null })
      .eq("email", email).eq("is_subscribed", false).select("id");
    if (restoreError) throw new AppError("We could not subscribe you. Please try again.", 503, "subscription_unavailable");
    shouldWelcome = Boolean(restored?.length);
  }
  if (shouldWelcome) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
      const unsubscribeUrl = await createUnsubscribeUrl(email, siteUrl);
      const welcome = newsletterWelcomeEmail({ siteUrl, unsubscribeUrl });
      await sendEmail({ to: email, subject: welcome.subject, html: welcome.html, text: welcome.text,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      });
    } catch (err) {
      // The subscription was saved. A welcome failure must not report otherwise.
      logger.error({ err }, "newsletter: welcome email could not be prepared");
    }
  }

  return Response.json(
    { data: { ok: true } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
