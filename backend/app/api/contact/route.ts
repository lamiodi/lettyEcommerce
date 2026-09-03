/**
 * POST /api/contact
 *
 * Public contact form endpoint.
 * - Validates the message.
 * - Inserts into `contact_submissions` (created on demand).
 * - Sends the customer an auto-reply (`contactAutoReplyEmail`).
 * - Sends the concierge inbox a notification (`contactConciergePingEmail`).
 *
 * Idempotency: by the (email, created_at_minute) tuple. We don't strictly
 * require this, but the rate limiter (per-IP) keeps abuse down.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import {
  contactAutoReplyEmail,
  contactConciergePingEmail,
} from "@/lib/email/templates";
import { enforceRateLimit, RateLimitError } from "@/lib/ratelimit";
import { corsHeaders } from "@/lib/cors";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(10).max(4000),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";

  const { success } = await enforceRateLimit("public", `contact:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid contact submission", issues: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { name, email, subject, message } = parsed.data;

  // Persist. The contact_submissions table is created by a SQL migration;
  // if it's not present, we still send the emails (the brand experience
  // doesn't depend on persistence).
  const { error: persistErr } = await supabaseAdmin()
    .from("contact_submissions")
    .insert({
      name,
      email,
      subject: subject ?? null,
      message,
      ip_address: ip,
      status: "new",
    });
  if (persistErr) {
    logger.warn({ err: persistErr }, "contact: persistence failed (continuing)");
  }

  // Customer auto-reply.
  try {
    const tpl = contactAutoReplyEmail({
      customerName: name,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    });
    void sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "contact_auto_reply" }],
    });
  } catch (err) {
    logger.error({ err, email }, "contact: auto-reply send failed");
  }

  // Concierge notification.
  try {
    const to = process.env.EMAIL_OWNER_ALERT ?? "lettybeautyco@gmail.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const tpl = contactConciergePingEmail({
      customerName: name,
      customerEmail: email,
      message: subject ? `[${subject}] ${message}` : message,
      adminUrl: `${siteUrl}/admin/notifications`,
    });
    void sendEmail({
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "contact_concierge_ping" }],
    });
  } catch (err) {
    logger.error({ err, email }, "contact: concierge ping send failed");
  }

  return Response.json(
    { data: { ok: true } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
