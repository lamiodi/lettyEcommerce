/**
 * GET/POST /api/customer/feedback
 * Records customer NPS survey ratings (0-10) from Maison satisfaction emails (PDF 3).
 */
import { NextRequest, NextResponse } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const GET = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const scoreRaw = url.searchParams.get("score");
  const orderNumber = url.searchParams.get("order");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";

  const score = scoreRaw ? parseInt(scoreRaw, 10) : NaN;

  if (!Number.isNaN(score) && score >= 0 && score <= 10 && orderNumber) {
    try {
      const { data: order } = await supabaseAdmin()
        .from("orders")
        .select("id, order_number, customer_id")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (order) {
        await supabaseAdmin().from("order_events").insert({
          order_id: order.id,
          event_type: "nps_feedback",
          metadata: { score, timestamp: new Date().toISOString() },
        });
        logger.info({ orderNumber, score }, "Customer NPS rating recorded");
      }
    } catch (err) {
      logger.warn({ err, orderNumber, score }, "Failed to record NPS feedback event (non-fatal)");
    }
  }

  // Redirect to the frontend feedback thank-you page
  const redirectUrl = new URL(`${siteUrl.replace(/\/$/, "")}/feedback`);
  if (!Number.isNaN(score)) redirectUrl.searchParams.set("score", score.toString());
  if (orderNumber) redirectUrl.searchParams.set("order", orderNumber);

  return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
});
