/**
 * POST /api/jobs/abandoned-cart
 * QStash-scheduled job: scan for abandoned carts older than 24h,
 * send a reminder email, and increment `reminder_count`.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { abandonedCartEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import type { Currency } from "@/lib/validations";

const REMINDER_HOURS = 24;
const MAX_REMINDERS = 2;

export const POST = asyncHandler(async (req: NextRequest) => {
  if (!(await isAuthorizedJobCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const threshold = new Date(Date.now() - REMINDER_HOURS * 60 * 60 * 1000).toISOString();
  const { data: carts, error } = await supabaseAdmin()
    .from("abandoned_carts")
    .select("id, customer_email, cart, currency, subtotal, recovery_token, reminder_count")
    .lt("created_at", threshold)
    .is("recovered_at", null)
    .lt("reminder_count", MAX_REMINDERS)
    .is("last_reminder_at", null);
  if (error) {
    logger.error({ error }, "abandoned-cart: scan failed");
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const cart of carts ?? []) {
    if (!cart.customer_email) continue;
    const items = (cart.cart as Array<{ quantity: number }> | null) ?? [];
    if (items.length === 0) continue;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const url = new URL(siteUrl);
    url.pathname = "/cart";
    if (cart.recovery_token) url.searchParams.set("ref", cart.recovery_token);

    const tpl = abandonedCartEmail({
      cartUrl: url.toString(),
      itemCount: items.reduce((a, i) => a + i.quantity, 0),
      currency: (cart.currency ?? "USD") as Currency,
      total: Number(cart.subtotal ?? 0),
    });
    const res = await sendEmail({
      to: cart.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
    if (res) {
      await supabaseAdmin()
        .from("abandoned_carts")
        .update({
          last_reminder_at: new Date().toISOString(),
          reminder_count: (cart.reminder_count ?? 0) + 1,
        })
        .eq("id", cart.id);
      sent++;
    }
  }

  return Response.json({ ok: true, sent });
});
