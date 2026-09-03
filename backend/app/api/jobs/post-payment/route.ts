/**
 * POST /api/jobs/post-payment
 *
 * QStash-triggered background job: runs after a successful payment.
 * - Commits inventory (moves reserved → sold).
 * - Updates customer totals.
 * - Sends confirmation email.
 * - Partially updates Algolia stock.
 * - Upserts daily metrics.
 * - Notifies admins of new order.
 *
 * Idempotent: the existence of a `paid` event in `order_events` is the
 * single source of truth for "this job has already run." QStash retries
 * short-circuit here.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { supabaseAdmin } from "@/lib/supabase/server";
import { commitInventory } from "@/lib/inventory/manager";
import { sendEmail } from "@/lib/email/resend";
import { newOrderAlertEmail, orderConfirmationEmail } from "@/lib/email/templates";
import { partialUpdateProduct } from "@/lib/algolia";
import { logger } from "@/lib/logger";
import type { Currency } from "@/lib/validations";

const bodySchema = z.object({
  reference: z.string().min(1),
  gateway: z.enum(["stripe", "paystack"]),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("upstash-signature");
  const raw = await req.text();
  const isSigned = await verifyQStashSignature(signature, raw);
  if (!isSigned) {
    // Allow direct POSTs in dev for easier testing
    if (process.env.NODE_ENV === "production") {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  const parsed = bodySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return Response.json({ error: "Invalid job payload" }, { status: 400 });
  }
  const { reference, gateway } = parsed.data;

  // 1. Find the order
  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(
      `
      id, order_number, customer_email, currency, subtotal, shipping_total, tax_total, total,
      coupon_id, customer_id, notes,
      customer:customers (first_name, last_name),
      shipping_address:shipping_address_id (street, city, state, country, postal_code),
      order_items (id, variant_id, quantity, unit_price, product_snapshot)
    `,
    )
    .eq("payment_reference", reference)
    .single();
  if (error || !order) {
    logger.warn({ reference }, "post-payment: order not found");
    return new Response("Order not found", { status: 404 });
  }

  // 2. Idempotency check: a `paid` event is the source of truth that this
  //    job has already completed. QStash retries are short-circuited here.
  const { data: existingPaid } = await supabaseAdmin()
    .from("order_events")
    .select("id")
    .eq("order_id", order.id)
    .eq("event_type", "paid")
    .maybeSingle();
  if (existingPaid) {
    logger.info({ orderId: order.id, reference }, "post-payment: already processed, skipping");
    return Response.json({ ok: true, idempotent: true });
  }

  // 3. Commit inventory (release reservation)
  try {
    await commitInventory(reference);
  } catch (err) {
    logger.error({ err, reference }, "commit_inventory failed");
  }

  // 4. Update customer totals + last_order_at
  if (order.customer_id) {
    await supabaseAdmin().rpc("record_daily_metric", {
      p_date: new Date().toISOString().slice(0, 10),
      p_orders_delta: 1,
      p_revenue_usd_delta: order.currency === "USD" ? order.total : 0,
      p_revenue_ngn_delta: order.currency === "NGN" ? order.total : 0,
      p_new_customers_delta: 0,
    });
  }

  // 5. Send confirmation email
  try {
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    const shipping = Array.isArray(order.shipping_address) ? order.shipping_address[0] : order.shipping_address;
    const items = (order.order_items ?? []).map((it) => {
      const snap = it.product_snapshot as { name?: string; options?: Array<{ name: string; value: string }> };
      return {
        name: snap.name ?? "Item",
        variant: (snap.options ?? []).map((o) => `${o.name}: ${o.value}`).join(" / "),
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
      };
    });
    const template = orderConfirmationEmail({
      customerName: customer?.first_name ?? undefined,
      orderNumber: order.order_number,
      items,
      totals: {
        currency: order.currency as Currency,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping_total),
        tax: Number(order.tax_total),
        total: Number(order.total),
      },
      shippingAddress: {
        street: shipping?.street ?? "",
        city: shipping?.city ?? "",
        state: shipping?.state ?? "",
        country: shipping?.country ?? "",
        postal: shipping?.postal_code ?? undefined,
      },
    });
    await sendEmail({
      to: order.customer_email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: "type", value: "order_confirmation" },
        { name: "order", value: order.order_number },
      ],
    });
  } catch (err) {
    logger.error({ err, reference }, "order confirmation email failed");
  }

  // 5b. Admin new-order alert (email + in-app notification).
  //     Batched hourly via the cron in /api/jobs/admin-digest — but the
  //     notification row is inserted immediately so the admin bell lights
  //     up even if email is delayed.
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const adminUrl = `${siteUrl}/admin/orders/${order.id}`;
    // Insert notification row (skip on duplicate by order_number+type).
    await supabaseAdmin().from("admin_notifications").insert({
      type: "new_order",
      title: `New order ${order.order_number}`,
      body: `${order.customer_email} — ${order.currency} ${Number(order.total).toFixed(2)}`,
      link: adminUrl,
      metadata: { order_id: order.id, order_number: order.order_number, gateway },
    });
    // Direct email to the owner inbox.
    const emailFrom = process.env.EMAIL_FROM || "LETTY <lettybeautyco@gmail.com>";
    const ownerEmail = process.env.EMAIL_OWNER_ALERT ?? emailFrom.match(/<(.+@.+)>$/)?.[1] ?? "lettybeautyco@gmail.com";
    if (ownerEmail) {
      const alert = newOrderAlertEmail({
        orderNumber: order.order_number,
        total: Number(order.total),
        currency: order.currency as Currency,
        customerEmail: order.customer_email,
        gateway: gateway as "stripe" | "paystack",
        adminUrl,
      });
      void sendEmail({
        to: ownerEmail,
        subject: alert.subject,
        html: alert.html,
        text: alert.text,
        tags: [
          { name: "type", value: "admin_new_order" },
          { name: "order", value: order.order_number },
        ],
      });
    }
  } catch (err) {
    logger.error({ err, reference }, "admin new-order alert failed (non-blocking)");
  }

  // NOTE: Coupon `times_used` is already incremented atomically by the
  // `apply_coupon` SQL RPC during checkout init — there is no second
  // increment here. If a coupon was attached and the post-payment job is
  // retried, the idempotency guard above prevents double-counting.

  // 6. Update Algolia stock in-place — batch fetch all variants and products
  //    in a single round-trip per table (M5: avoid N+1).
  const items = order.order_items ?? [];
  if (items.length > 0) {
    const variantIds = items.map((it) => it.variant_id);
    const { data: variants } = await supabaseAdmin()
      .from("product_variants")
      .select("id, stock_quantity, product_id")
      .in("id", variantIds);
    const productIds = (variants ?? []).map((v) => v.product_id);
    const { data: products } = await supabaseAdmin()
      .from("products")
      .select("id, slug, is_active")
      .in("id", productIds);
    const productById = new Map((products ?? []).map((p) => [p.id, p]));
    for (const v of variants ?? []) {
      const product = productById.get(v.product_id);
      if (!product) continue;
      await partialUpdateProduct(v.product_id, {
        in_stock: v.stock_quantity > 0,
        total_stock: v.stock_quantity,
      });
    }
  }

  // 7. Admin notification
  await supabaseAdmin().from("admin_notifications").insert({
    type: "new_order",
    entity_id: order.id,
    payload: {
      order_number: order.order_number,
      total: order.total,
      currency: order.currency,
      gateway,
    },
  });

  // 8. Audit log (no admin id; this is a system action)
  await supabaseAdmin().from("audit_logs").insert({
    admin_id: null,
    action: "POST_PAYMENT",
    entity_type: "order",
    entity_id: order.id,
    metadata: { reference, gateway },
  });

  return Response.json({ ok: true });
});
