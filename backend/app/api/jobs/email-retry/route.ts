import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { deliverQueuedEmail } from "@/lib/email/outbox";
import { logger } from "@/lib/logger";

export const POST = asyncHandler(async (req: NextRequest) => {
  if (!(await isAuthorizedJobCall(req))) return new Response("Unauthorized", { status: 401 });
  const { data, error } = await supabaseAdmin().from("email_outbox")
    .select("dedupe_key").is("sent_at", null).lt("attempts", 12)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at").limit(20);
  if (error) return Response.json({ ok: false, error: "Email queue unavailable" }, { status: 503 });
  let sent = 0;
  let failed = 0;
  for (const row of data ?? []) {
    try {
      if (await deliverQueuedEmail(row.dedupe_key) === "sent") sent++;
    } catch (err) {
      failed++;
      logger.error({ err, key: row.dedupe_key }, "Confirmation retry failed");
    }
  }
  return Response.json({ ok: failed === 0, sent, failed }, { status: failed ? 503 : 200 });
});
