/**
 * GET /api/customer/feedback
 * Legacy email-link target: redirects to the frontend /feedback page, where
 * the rating is only recorded after an explicit confirm click (POST
 * /api/feedback). This GET never writes — link-prefetch bots (Gmail/Outlook)
 * must not be able to fabricate ratings.
 */
import { NextRequest, NextResponse } from "next/server";
import { asyncHandler } from "@/lib/handler";

export const GET = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const scoreRaw = url.searchParams.get("score");
  const orderNumber = url.searchParams.get("order");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";

  const score = scoreRaw ? parseInt(scoreRaw, 10) : NaN;

  // Redirect to the frontend feedback thank-you page
  const redirectUrl = new URL(`${siteUrl.replace(/\/$/, "")}/feedback`);
  if (!Number.isNaN(score)) redirectUrl.searchParams.set("score", score.toString());
  if (orderNumber) redirectUrl.searchParams.set("order", orderNumber);

  return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
});
