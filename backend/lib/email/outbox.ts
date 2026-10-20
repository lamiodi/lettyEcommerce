import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, type SendEmailInput } from "@/lib/email/resend";
import { logger } from "@/lib/logger";

/** Keep the first receipt unchanged across retries, including its provider key. */
export async function queueConfirmation(orderId: string, payload: SendEmailInput): Promise<string> {
  const key = `order-confirmation/${orderId}`;
  const { error } = await supabaseAdmin().from("email_outbox").upsert({
    dedupe_key: key, order_id: orderId, payload,
  }, { onConflict: "dedupe_key", ignoreDuplicates: true });
  if (error) throw new Error(`Could not persist confirmation: ${error.code}`);
  return key;
}

/** An atomic lease lets a webhook and the retry job share the same queue safely. */
export async function deliverQueuedEmail(key: string, sender: typeof sendEmail = sendEmail): Promise<"sent" | "pending" | "skipped"> {
  const token = randomUUID();
  const now = new Date();
  const { data: row, error } = await supabaseAdmin().from("email_outbox")
    .update({ lock_token: token, locked_until: new Date(now.getTime() + 5 * 60_000).toISOString() })
    .eq("dedupe_key", key).is("sent_at", null).lt("attempts", 12)
    .lte("next_attempt_at", now.toISOString())
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select("id, payload, attempts").maybeSingle();
  if (error) throw new Error(`Could not claim confirmation: ${error.code}`);
  if (!row) return "skipped";

  const attempts = Number(row.attempts) + 1;
  const { error: attemptError } = await supabaseAdmin().from("email_outbox")
    .update({ attempts }).eq("id", row.id).eq("lock_token", token);
  if (attemptError) throw new Error("Could not record confirmation attempt");

  const result = await sender({ ...(row.payload as SendEmailInput), idempotencyKey: key });
  const { error: saveError } = await supabaseAdmin().from("email_outbox").update(result ? {
    sent_at: new Date().toISOString(), provider_id: result.id,
    locked_until: null, lock_token: null, last_error: null,
  } : {
    next_attempt_at: new Date(Date.now() + Math.min(6 * 60 * 60_000, 60_000 * 2 ** attempts)).toISOString(),
    locked_until: null, lock_token: null, last_error: "Email provider did not accept the confirmation",
  }).eq("id", row.id).eq("lock_token", token);
  if (saveError) {
    logger.error({ key, error: saveError }, "Could not save confirmation delivery result");
    throw new Error("Could not save confirmation delivery result");
  }
  if (!result && attempts === 12) {
    const { error: alertError } = await supabaseAdmin().from("admin_notifications").insert({
      type: "email_failure", title: "Order confirmation needs attention",
      body: "Automatic email retries were exhausted. Check the provider logs before arranging a resend.",
      link: "/admin/orders", metadata: { dedupe_key: key },
    });
    if (alertError) logger.error({ key, error: alertError }, "Could not alert admin about exhausted email retries");
  }
  return result ? "sent" : "pending";
}
