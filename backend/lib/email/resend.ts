/**
 * Resend client + typed email sender.
 * All transactional emails are sent via the helpers in lib/email/templates.
 */
import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const cfg = env();
  if (!cfg.RESEND_API_KEY) return null;
  _resend = new Resend(cfg.RESEND_API_KEY);
  return _resend;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string } | null> {
  const resend = getResend();
  if (!resend) {
    logger.warn({ to: input.to, subject: input.subject }, "RESEND_API_KEY missing — skipping send");
    return null;
  }
  try {
    const res = await resend.emails.send({
      from: env().EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      tags: input.tags,
    });
    if (res.error) {
      logger.error({ error: res.error }, "Resend returned an error");
      return null;
    }
    return { id: res.data?.id ?? "unknown" };
  } catch (err) {
    logger.error({ err }, "Failed to send email");
    return null;
  }
}
