/**
 * Resend client + typed email sender.
 * All transactional emails are sent via the helpers in lib/email/templates.
 *
 * Free-tier budget: Resend's free plan allows 100 emails/DAY. To never hit
 * that wall, this module keeps an in-process UTC-day counter (single Render
 * instance — same assumption as the in-process rate limiter) with three
 * priority tiers:
 *  - critical — must-deliver (order confirmation, password reset, payment
 *    failed, admin order updates). NEVER budget-blocked: these cannot be
 *    triggered by unauthenticated traffic in volume, and suppressing an
 *    order confirmation is worse than brushing the provider quota.
 *  - transactional — shopper-triggered but drainable (newsletter welcome,
 *    register welcome, contact auto-reply/owner alert). Blocked once the
 *    day's DAILY_BUDGET is spent, so unauthenticated traffic can never eat
 *    the quota that critical email needs.
 *  - bulk — cron-job sends that can wait a day. Blocked at BULK_FLOOR,
 *    reserving headroom for everything above.
 * The counter under-counts after a restart/deploy, so the defaults leave a
 * margin below 100. Set EMAIL_DAILY_BUDGET high (e.g. 50000) once on a paid
 * plan to make the guard a no-op.
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

const DAILY_BUDGET = Number(process.env.EMAIL_DAILY_BUDGET || 90);
const BULK_FLOOR = Math.floor(DAILY_BUDGET * 2 / 3);

let _budgetDay = "";
let _budgetCount = 0;
function budgetExceeded(priority: "critical" | "transactional" | "bulk"): boolean {
  if (priority === "critical") return false;
  const day = new Date().toISOString().slice(0, 10);
  if (day !== _budgetDay) {
    _budgetDay = day;
    _budgetCount = 0;
  }
  return _budgetCount >= (priority === "bulk" ? BULK_FLOOR : DAILY_BUDGET);
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  /**
   * critical = must-deliver, never budget-blocked; bulk = cron-job sends that
   * can wait a day; transactional = shopper-triggered but drainable (default).
   */
  priority?: "critical" | "transactional" | "bulk";
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
  const priority = input.priority ?? "transactional";
  if (budgetExceeded(priority)) {
    logger.warn(
      { to: input.to, subject: input.subject, priority, sentToday: _budgetCount, budget: DAILY_BUDGET },
      "Daily email budget reached — send skipped (will retry via job idempotency)",
    );
    return null;
  }
  try {
    const from = process.env.EMAIL_FROM || "LETTY <Hello@houseofletty.com>";
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
    _budgetCount += 1;
    return { id: res.data?.id ?? "unknown" };
  } catch (err) {
    logger.error({ err }, "Failed to send email");
    return null;
  }
}
