/**
 * Post-payment processing pipeline.
 *
 * Runs automatically after an order is marked paid:
 * 1. Checks idempotency (prevents double processing).
 * 2. Commits inventory (moves reserved → sold).
 * 3. Records daily metrics.
 * 4. Sends branded customer confirmation email via Resend.
 * 5. Sends owner new-order alert email and creates in-app admin notification.
 * 6. Partially updates Algolia stock in-place (if configured).
 * 7. Records audit log and `post_payment_completed` event.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { commitInventory } from "@/lib/inventory/manager";
import { sendEmail } from "@/lib/email/resend";
import { newOrderAlertEmail, orderConfirmationEmail } from "@/lib/email/templates";
import { partialUpdateProduct } from "@/lib/algolia";
import { logger } from "@/lib/logger";
import type { Currency } from "@/lib/validations";

export interface PostPaymentResult {
  ok: boolean;
  idempotent?: boolean;
  orderId?: string;
  orderNumber?: string;
}

export async function executePostPayment(
  reference: string,
  gateway: "stripe" = "stripe",
): Promise<PostPaymentResult> {
  // 1. Find the order
  const { data: order, error } = await supabaseAdmin()
    .from("orders")
    .select(
      `
      id, order_number, customer_email, currency, subtotal, discount_total, gift_card_total,
      shipping_total, tax_total, total, coupon_id, customer_id, notes, payment_gateway, created_at,
      customer:customers (first_name, last_name),
      shipping_address:shipping_address_id (first_name, last_name, street, city, state, country, postal_code),
      billing_address:billing_address_id (first_name, last_name, street, city, state, country, postal_code),
      shipping_method:shipping_method_id (name),
      order_items (id, variant_id, quantity, unit_price, product_snapshot)
    `,
    )
    .eq("payment_reference", reference)
    .single();

  if (error || !order) {
    logger.warn({ reference }, "post-payment: order not found");
    return { ok: false };
  }

  // 2. Idempotency check: verify if post-payment has already completed for this order.
  const { data: existingCompleted } = await supabaseAdmin()
    .from("order_events")
    .select("id")
    .eq("order_id", order.id)
    .eq("event_type", "post_payment_completed")
    .maybeSingle();

  if (existingCompleted) {
    logger.info({ orderId: order.id, reference }, "post-payment: already processed, skipping duplicate");
    return { ok: true, idempotent: true, orderId: order.id, orderNumber: order.order_number };
  }

  // 3. Commit inventory (moves reserved stock to sold)
  try {
    await commitInventory(reference);
  } catch (err) {
    logger.error({ err, reference }, "commit_inventory failed during post-payment");
  }

  // 4. Update customer totals + metrics
  if (order.customer_id) {
    try {
      await supabaseAdmin().rpc("record_daily_metric", {
        p_date: new Date().toISOString().slice(0, 10),
        p_orders_delta: 1,
        p_revenue_usd_delta: order.currency === "USD" ? order.total : 0,
        p_revenue_ngn_delta: order.currency === "NGN" ? order.total : 0,
        p_new_customers_delta: 0,
      });
    } catch (metricErr) {
      logger.warn({ metricErr }, "record_daily_metric non-fatal failure");
    }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost"))
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.houseofletty.com";
  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
  const shipping = Array.isArray(order.shipping_address) ? order.shipping_address[0] : order.shipping_address;
  const billing = Array.isArray(order.billing_address) ? order.billing_address[0] : order.billing_address;
  const shippingMethod = Array.isArray(order.shipping_method) ? order.shipping_method[0] : order.shipping_method;

  // 5. Send customer order confirmation email
  try {
    const items = (order.order_items ?? []).map((it: {
      product_snapshot?: unknown;
      quantity: number;
      unit_price: number | string;
    }) => {
      const snap = it.product_snapshot as { name?: string; options?: Array<{ name: string; value: string }>; primary_image?: string | null } | null;
      return {
        name: snap?.name ?? "Item",
        variant: (snap?.options ?? []).map((o) => `${o.name}: ${o.value}`).join(" / ") || undefined,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        image_url: snap?.primary_image ?? null,
      };
    });

    const template = orderConfirmationEmail({
      customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
      orderNumber: order.order_number,
      items,
      totals: {
        currency: order.currency as Currency,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount_total),
        gift_card: Number(order.gift_card_total),
        shipping: Number(order.shipping_total),
        tax: Number(order.tax_total),
        total: Number(order.total),
      },
      shippingAddress: {
        recipientName: [shipping?.first_name, shipping?.last_name].filter(Boolean).join(" ") || undefined,
        street: shipping?.street ?? "",
        city: shipping?.city ?? "",
        state: shipping?.state ?? "",
        country: shipping?.country ?? "",
        postal: shipping?.postal_code ?? undefined,
      },
      billingAddress: billing ? {
        recipientName: [billing.first_name, billing.last_name].filter(Boolean).join(" ") || undefined,
        street: billing.street ?? "",
        city: billing.city ?? "",
        state: billing.state ?? "",
        country: billing.country ?? "",
        postal: billing.postal_code ?? undefined,
      } : undefined,
      orderDate: order.created_at,
      paymentMethod: order.payment_gateway === "stripe" ? "Card or digital wallet" : "Secure online payment",
      deliveryMethod: shippingMethod?.name ?? "Standard delivery",
      siteUrl,
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
    logger.info({ orderNumber: order.order_number, to: order.customer_email }, "Customer confirmation email sent");
  } catch (err) {
    logger.error({ err, reference }, "order confirmation email failed");
    // A paid order whose confirmation email failed is a support incident —
    // surface it on the dashboard bell instead of only a log line.
    try {
      await supabaseAdmin().from("admin_notifications").insert({
        type: "email_failure",
        title: `Confirmation email failed — order ${order.order_number}`,
        body: `Payment succeeded but the customer email to ${order.customer_email} failed. Resend from the order page.`,
        link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com"}/admin/orders/${order.id}`,
        metadata: { order_id: order.id, order_number: order.order_number, reference },
      });
    } catch (notifyErr) {
      logger.error({ notifyErr, reference }, "email-failure notification insert failed");
    }
  }

  // 6. Owner new-order alert (email + in-app notification)
  try {
    const adminUrl = `${siteUrl}/admin/orders/${order.id}`;

    // In-app notification for admin dashboard bell
    await supabaseAdmin().from("admin_notifications").insert({
      type: "new_order",
      title: `New order ${order.order_number}`,
      body: `${order.customer_email} — ${order.currency} ${Number(order.total).toFixed(2)}`,
      link: adminUrl,
      metadata: { order_id: order.id, order_number: order.order_number, gateway },
    });

    // Alert email directly to the store owner
    const emailFrom = process.env.EMAIL_FROM || "LETTY <concierge@houseofletty.com>";
    const ownerEmail =
      process.env.EMAIL_OWNER_ALERT ?? emailFrom.match(/<(.+@.+)>$/)?.[1] ?? "lettybeautyco@gmail.com";

    if (ownerEmail) {
      const alert = newOrderAlertEmail({
        orderNumber: order.order_number,
        total: Number(order.total),
        currency: order.currency as Currency,
        customerEmail: order.customer_email,
        gateway: "stripe",
        adminUrl,
      });

      await sendEmail({
        to: ownerEmail,
        subject: alert.subject,
        html: alert.html,
        text: alert.text,
        tags: [
          { name: "type", value: "owner_new_order_alert" },
          { name: "order", value: order.order_number },
        ],
      });
      logger.info({ orderNumber: order.order_number, to: ownerEmail }, "Owner alert email sent");
    }
  } catch (err) {
    logger.warn({ err }, "Admin new-order notification / email warning");
  }

  // 7. Update Algolia search stock counts if items exist
  const items = order.order_items ?? [];
  if (items.length > 0) {
    try {
      const variantIds = items.map((it: { variant_id: string }) => it.variant_id);
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
    } catch (algoliaErr) {
      logger.warn({ algoliaErr }, "Algolia stock partial update non-fatal error");
    }
  }

  // 8. Record event so subsequent runs know this job completed
  await supabaseAdmin().from("order_events").insert({
    order_id: order.id,
    event_type: "post_payment_completed",
    metadata: { gateway },
  });

  // 9. Audit log
  await supabaseAdmin().from("audit_logs").insert({
    admin_id: null,
    action: "POST_PAYMENT",
    entity_type: "order",
    entity_id: order.id,
    metadata: { reference, gateway },
  });

  return { ok: true, orderId: order.id, orderNumber: order.order_number };
}
