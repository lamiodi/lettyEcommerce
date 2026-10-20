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
import { clientIp } from "@/lib/utils/client-ip";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().trim().min(10).max(4000),
  order_number: z.string().trim().min(1).max(32).optional(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    clientIp(req);

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
  const { name, email, subject, message, order_number } = parsed.data;

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
      order_number: order_number ?? null,
      ip_address: ip,
      status: "new",
    });
  if (persistErr) {
    logger.error({ err: persistErr }, "contact: message could not be saved");
  }

  // Notify the owner before acknowledging receipt to the customer.
  let ownerNotified = false;
  try {
    const to = process.env.EMAIL_OWNER_ALERT ?? "lettybeautyco@gmail.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
    const tpl = contactConciergePingEmail({
      customerName: name,
      customerEmail: email,
      message: [subject ? `[${subject}]` : "", order_number ? `Order: ${order_number}` : "", message].filter(Boolean).join("\n\n"),
      adminUrl: `${siteUrl}/admin/notifications`,
    });
    const delivery = await sendEmail({
      to,
      replyTo: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "contact_concierge_ping" }],
    });
    ownerNotified = Boolean(delivery);
  } catch (err) {
    logger.error({ err, email }, "contact: concierge ping send failed");
  }

  if (persistErr && !ownerNotified) {
    return Response.json(
      { error: "We couldn’t receive your message. Please try again or email hello@houseofletty.com." },
      { status: 503, headers: corsHeaders(req.headers.get("origin")) },
    );
  }

  if (!ownerNotified) {
    const { error: notificationError } = await supabaseAdmin().from("admin_notifications").insert({
      type: "contact_submission",
      title: "Customer message received; email notification failed",
      body: `${name} (${email}): ${message}`,
      link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com"}/admin/notifications`,
      metadata: { name, email, subject, order_number },
    });
    if (notificationError) logger.error({ notificationError }, "contact: dashboard notification failed");
  }

  // Only confirm receipt after the message was saved or delivered to the owner.
  try {
    const tpl = contactAutoReplyEmail({
      customerName: name,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com",
    });
    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "contact_auto_reply" }],
    });
  } catch (err) {
    logger.error({ err, email }, "contact: auto-reply send failed");
  }

  return Response.json(
    { data: { ok: true } },
    { status: 201, headers: corsHeaders(req.headers.get("origin")) },
  );
});
