import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase/server";

function signingKey() {
  const secret = process.env.EMAIL_PREFERENCES_SECRET || process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error("Email preference signing is not configured");
  return new TextEncoder().encode(secret);
}

/** A signed link authorizes opting out only; it cannot authenticate an account. */
export async function createUnsubscribeUrl(email: string, siteUrl: string): Promise<string> {
  const token = await new SignJWT({ email: email.trim().toLowerCase() })
    .setProtectedHeader({ alg: "HS256" }).setIssuer("letty-email-preferences")
    .setAudience("unsubscribe").sign(signingKey());
  return `${siteUrl.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function readUnsubscribeEmail(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, signingKey(), {
    algorithms: ["HS256"], issuer: "letty-email-preferences", audience: "unsubscribe",
  });
  if (typeof payload.email !== "string" || !payload.email.includes("@")) throw new Error("Invalid email preference link");
  return payload.email;
}

/** Optional campaigns are sent only to readers with an active subscription. */
export async function hasEmailSubscription(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("newsletter_subscribers")
    .select("is_subscribed").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (error) throw new Error("Email preferences could not be checked");
  return data?.is_subscribed === true;
}
