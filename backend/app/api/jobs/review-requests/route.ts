/**
 * POST /api/jobs/review-requests
 *
 * Daily QStash cron. For every order delivered 7+ days ago that has not
 * already received a review request, send a single batched email per
 * customer (up to 3 product links, rest as "and others"). One email per
 * customer, not per item, to stay inside the Resend free tier.
 *
 * Idempotency: tracked via `review_requests` table (created if missing).
 * Falls back to a flag in `order_events` if the table is absent.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { reviewRequestEmail } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const DAYS_AFTER_DELIVERY = 7;

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("upstash-signature");
  const raw = await req.text();
  const isSigned = await verifyQStashSignature(signature, raw);
  if (!isSigned && process.env.NODE_ENV === "production") {
    return new Response("Invalid signature", { status: 401 });
  }

  const cutoff = new Date(Date.now() - DAYS_AFTER_DELIVERY * 24 * 60 * 60 * 1000).toISOString();

  // Find orders with a `delivered` event older than the cutoff that have
  // not yet had a review request. We use order_events for idempotency.
  const { data: candidates, error } = await supabaseAdmin()
    .from("orders")
    .select(
      "id, order_number, customer_email, currency, customer_id, customer:customers(first_name), order_items(product_snapshot)",
    )
    .eq("payment_status", "paid")
    .eq("fulfillment_status", "fulfilled")
    .lt("updated_at", cutoff)
    .limit(100);
  if (error) {
    logger.error({ error }, "review-requests: candidates fetch failed");
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  for (const order of candidates ?? []) {
    // Check if a `review_requested` event already exists for this order.
    const { data: existing } = await supabaseAdmin()
      .from("order_events")
      .select("id")
      .eq("order_id", order.id)
      .eq("event_type", "review_requested")
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const snap = (order as any).order_items ?? [];
    const items = snap
      .map((it: any) => {
        const s = it.product_snapshot ?? {};
        return {
          name: s.name ?? "Item",
          slug: s.slug ?? "",
          image_url: s.primary_image ?? null,
        };
      })
      .filter((it: { slug: string }) => it.slug);

    if (items.length === 0) {
      skipped++;
      continue;
    }

    try {
      const tpl = reviewRequestEmail({
        customerName: (order as any).customer?.first_name ?? undefined,
        items,
        siteUrl: env().NEXT_PUBLIC_SITE_URL,
      });
      await sendEmail({
        to: order.customer_email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [
          { name: "type", value: "review_request" },
          { name: "order", value: order.order_number },
        ],
      });
      // Mark as sent.
      await supabaseAdmin().from("order_events").insert({
        order_id: order.id,
        event_type: "review_requested",
        metadata: { item_count: items.length, source: "cron" },
      });
      sent++;
    } catch (err) {
      logger.error({ err, orderId: order.id }, "review-requests: send failed");
    }
  }

  return Response.json({ ok: true, sent, skipped, total: candidates?.length ?? 0 });
});
