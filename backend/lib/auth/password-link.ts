import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { passwordResetEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";

/** Email ownership must be proved before a guest record gains a password. */
export async function sendPasswordLink(customer: { id: string; email: string; firstName?: string }, setup = false): Promise<boolean> {
  const token = randomBytes(32).toString("hex");
  const { error } = await supabaseAdmin().from("password_reset_tokens").insert({
    customer_id: customer.id, token_hash: createHash("sha256").update(token).digest("hex"),
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  if (error) throw new Error("Could not create a secure password link");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  const template = passwordResetEmail({ customerName: customer.firstName, siteUrl, setup,
    resetUrl: `${siteUrl.replace(/\/$/, "")}/reset-password?token=${token}${setup ? "&setup=1" : ""}`,
  });
  return Boolean(await sendEmail({ priority: "critical", to: customer.email, ...template,
    tags: [{ name: "type", value: setup ? "account_setup" : "password_reset" }],
  }));
}
