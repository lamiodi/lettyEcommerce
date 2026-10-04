/**
 * POST /api/jobs/satisfaction-survey
 *
 * Daily cron. Customers who wrote to Customer Service via the contact
 * form receive the satisfaction survey (`customerSatisfactionSurveyEmail`)
 * two days after their note — enough time for concierge to reply first.
 *
 * Idempotency: `contact_submissions.survey_sent_at` (migration 031).
 * Cooldown: at most one survey per email address per 30 days, even if
 * they write in repeatedly.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { customerSatisfactionSurveyEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

const DAYS_AFTER_CONTACT = 2;
const COOLDOWN_DAYS = 30;

export const POST = asyncHandler(async (req: NextRequest) => {
  if (!(await isAuthorizedJobCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - DAYS_AFTER_CONTACT * 24 * 60 * 60 * 1000).toISOString();
  const cooldownStart = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabaseAdmin()
    .from("contact_submissions")
    .select("id, name, email, order_number, created_at")
    .lt("created_at", cutoff)
    .is("survey_sent_at", null)
    .neq("status", "spam")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    logger.error({ error }, "satisfaction-survey: candidates fetch failed");
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  interface ContactCandidate {
    id: string;
    name: string;
    email: string;
    order_number: string | null;
    created_at: string;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let sent = 0;
  let skipped = 0;

  for (const submission of (candidates ?? []) as unknown as ContactCandidate[]) {
    // One survey per email per cooldown window, across all submissions.
    const { data: recent } = await supabaseAdmin()
      .from("contact_submissions")
      .select("id")
      .eq("email", submission.email)
      .gte("survey_sent_at", cooldownStart)
      .limit(1);
    if (recent && recent.length > 0) {
      skipped++;
      continue;
    }

    try {
      const tpl = customerSatisfactionSurveyEmail({
        customerName: submission.name,
        orderNumber: submission.order_number ?? undefined,
        siteUrl,
      });
      const res = await sendEmail({
        to: submission.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [{ name: "type", value: "satisfaction_survey" }],
      });
      if (!res) {
        skipped++;
        continue;
      }
      await supabaseAdmin()
        .from("contact_submissions")
        .update({ survey_sent_at: new Date().toISOString() })
        .eq("id", submission.id);
      sent++;
    } catch (err) {
      logger.error({ err, submissionId: submission.id }, "satisfaction-survey: send failed");
    }
  }

  return Response.json({ ok: true, sent, skipped, total: candidates?.length ?? 0 });
});
