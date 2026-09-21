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

  // Batch-load product names + primary images for every cart's variant ids,
  // so reminder emails can show what is actually waiting in the bag.
  const variantIds = [
    ...new Set(
      (carts ?? []).flatMap((c) =>
        ((c.cart as Array<{ variant_id?: string }> | null) ?? [])
          .map((i) => i.variant_id)
          .filter((v): v is string => Boolean(v)),
      ),
    ),
  ];
  const variantInfo = new Map<string, { name: string; image: string | null }>();
  if (variantIds.length > 0) {
    const { data: variants } = await supabaseAdmin()
      .from("product_variants")
      .select(
        `id, product:products!inner(name, product_media(url, position, is_primary))`,
      )
      .in("id", variantIds);
    for (const v of variants ?? []) {
      const product = Array.isArray(v.product) ? v.product[0] : v.product;
      if (!product) continue;
      const media = ((product.product_media ?? []) as Array<{ url: string; position: number; is_primary: boolean }>)
        .sort((a, b) => a.position - b.position);
      const primary = media.find((m) => m.is_primary) ?? media[0];
      variantInfo.set(v.id, { name: product.name, image: primary?.url ?? null });
    }
  }

  let sent = 0;
  for (const cart of carts ?? []) {
    if (!cart.customer_email) continue;
    const items = (cart.cart as Array<{ variant_id?: string; quantity: number }> | null) ?? [];
    if (items.length === 0) continue;

    const emailItems = items
      .map((i) => {
        const info = i.variant_id ? variantInfo.get(i.variant_id) : undefined;
        return { name: info?.name ?? "Your selection", quantity: i.quantity, image_url: info?.image ?? null };
      });

    // First name for the subject line (best-effort).
    const { data: customer } = await supabaseAdmin()
      .from("customers")
      .select("first_name")
      .eq("email", cart.customer_email)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const url = new URL(siteUrl);
    url.pathname = "/cart";
    if (cart.recovery_token) url.searchParams.set("ref", cart.recovery_token);

    const tpl = abandonedCartEmail({
      customerName: customer?.first_name ?? undefined,
      cartUrl: url.toString(),
      itemCount: items.reduce((a, i) => a + i.quantity, 0),
      currency: (cart.currency ?? "USD") as Currency,
      total: Number(cart.subtotal ?? 0),
      items: emailItems,
    });
    const res = await sendEmail({
      to: cart.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "abandoned_cart" }],
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
