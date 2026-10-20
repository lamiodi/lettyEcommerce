import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { readUnsubscribeEmail } from "@/lib/email/preferences";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { clientIp } from "@/lib/utils/client-ip";

export const POST = asyncHandler(async (req: NextRequest) => {
  const { success } = await enforceRateLimit("public", `unsubscribe:${clientIp(req)}`);
  if (!success) return Response.json({ error: "Please try again shortly." }, { status: 429 });
  const body: unknown = await req.json().catch(() => null);
  const token = body && typeof body === "object" && "token" in body ? body.token : null;
  if (typeof token !== "string" || token.length > 2048) {
    return Response.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
  }
  let email: string;
  try {
    email = await readUnsubscribeEmail(token);
  } catch {
    return Response.json({ error: "This link is invalid. Contact hello@houseofletty.com for help." }, { status: 400 });
  }
  const { error } = await supabaseAdmin().from("newsletter_subscribers").upsert({
    email, is_subscribed: false, unsubscribed_at: new Date().toISOString(),
  }, { onConflict: "email" });
  if (error) return Response.json({ error: "We could not save your preference. Please try again." }, { status: 503 });
  return Response.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
});
