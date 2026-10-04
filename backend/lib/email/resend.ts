/**
 * Resend client + typed email sender.
 * All transactional emails are sent via the helpers in lib/email/templates.
 */
import { Resend } from "resend";
import { logger } from "@/lib/logger";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _resend = new Resend(apiKey);
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
    // Error-level on purpose: a missing key silently voids every customer
    // email (order confirmations included) — this must be impossible to miss
    // in the Render logs during a smoke test.
    logger.error({ to: input.to, subject: input.subject }, "RESEND_API_KEY missing — email NOT sent");
    return null;
  }
  try {
    const from = process.env.EMAIL_FROM || "LETTY <concierge@houseofletty.com>";
    const res = await resend.emails.send({
      from,
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
