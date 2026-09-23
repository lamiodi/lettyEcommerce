"use server";

/**
 * Admin order Server Actions.
 * Fulfillment state machine, refunds, internal notes.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { releaseInventory, restockVariant } from "@/lib/inventory/manager";
import { safeAction, type ActionResult } from "@/lib/handler";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { orderShippedEmail, orderDeliveredEmail, orderReadyForPickupEmail, refundIssuedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import { refundPaymentIntent } from "@/lib/payments/stripe";
import type { Currency } from "@/lib/validations";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

const fulfillmentSchema = z.object({
  status: z.enum(["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"]),
});

export async function updateFulfillmentAction(
  orderId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string; fulfillment_status: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");
    const parsed = fulfillmentSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { status } = parsed.data;

    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select("id, fulfillment_status, payment_status")
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");

    if (current.fulfillment_status === "cancelled") {
      throw new ConflictError("Order is already cancelled — create a new order instead of reopening this one");
    }
    if (current.fulfillment_status === "fulfilled" && status === "cancelled") {
      throw new ConflictError("Cannot cancel a fulfilled order — use Refund instead");
    }
    if (current.fulfillment_status === status) {
      return { id: orderId, fulfillment_status: status };
    }

    // Conditional update: the transition only applies if the status is still
    // what we read. Two concurrent updates cannot both win, so inventory is
    // released exactly once for the live → cancelled transition.
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ fulfillment_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("fulfillment_status", current.fulfillment_status)
      .select("id, fulfillment_status, order_number, payment_status")
      .single();
    if (error || !data) {
      throw new ConflictError("Order status changed while updating — reload and try again");
    }

    if (status === "cancelled") {
      await releaseInventory(orderId);
    }
    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: status === "fulfilled" ? "delivered" : status,
      metadata: { source: "admin" },
      created_by: admin.sub,
    });
    await audit(admin, "UPDATE_FULFILLMENT", "order", orderId, { status });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { id: data.id, fulfillment_status: data.fulfillment_status };
  });
}

const trackingSchema = z.object({
  carrier: z.string().min(1).max(60),
  tracking_number: z.string().min(1).max(80),
});

export async function markShippedAction(
  orderId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");
    const parsed = trackingSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);

    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select("id, payment_status, fulfillment_status, order_number")
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");

    if (current.payment_status !== "paid") {
      throw new Error(`Cannot ship an order with payment status '${current.payment_status}'`);
    }
    if (current.fulfillment_status === "cancelled") {
      throw new ConflictError("Cannot ship a cancelled order");
    }

    // Double-ship guard keyed on events, not the status: shipping moves the
    // order to partially_fulfilled ("in transit" — the enum has no `shipped`
    // value), and only the delivered transition may follow. An order that was
    // delivered directly (no ship event) cannot be shipped afterwards either.
    const { data: lifecycleEvent } = await supabaseAdmin()
      .from("order_events")
      .select("id, event_type")
      .eq("order_id", orderId)
      .in("event_type", ["shipped", "delivered"])
      .limit(1)
      .maybeSingle();
    if (lifecycleEvent) {
      throw new ConflictError(
        lifecycleEvent.event_type === "shipped"
          ? "Order has already been shipped — use Mark Delivered instead"
          : "Order has already been delivered",
      );
    }

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({
        // partially_fulfilled = in transit. `fulfilled` is reserved for the
        // delivered transition so shipped vs delivered stay distinguishable.
        fulfillment_status: "partially_fulfilled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_number")
      .single();
    if (error || !data) throw new NotFoundError("Order not found");

    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: "shipped",
      metadata: { carrier: parsed.data.carrier, tracking_number: parsed.data.tracking_number },
      created_by: admin.sub,
    });
    await audit(admin, "MARK_SHIPPED", "order", orderId, parsed.data);

    // Email: shipping confirmation (item 2.1.4).
    try {
      const { data: full } = await supabaseAdmin()
        .from("orders")
        .select(
          "order_number, customer_email, currency, customer:customers(first_name), order_items(product_snapshot)",
        )
        .eq("id", orderId)
        .single();
      if (full) {
        const tpl = orderShippedEmail({
          customerName: (full as unknown as { customer?: { first_name?: string } }).customer?.first_name ?? undefined,
          orderNumber: full.order_number,
          carrier: parsed.data.carrier,
          trackingNumber: parsed.data.tracking_number,
          trackingUrl: `https://track.aftership.com/${encodeURIComponent(parsed.data.tracking_number)}`,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        });
        void sendEmail({
          to: full.customer_email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          tags: [
            { name: "type", value: "order_shipped" },
            { name: "order", value: full.order_number },
          ],
        });
      }
    } catch (err) {
      logger.error({ err, orderId }, "orderShipped email failed (non-blocking)");
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { id: data.id };
  });
}

/**
 * Mark an order as delivered. Idempotent: re-running on an already-delivered
 * order is a no-op (we still audit-log it). Sends the `orderDelivered`
 * email (item 2.1.6) on the first transition.
 */
export async function markDeliveredAction(
  orderId: string,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");

    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select(`
        id, payment_status, fulfillment_status, order_number, customer_email, currency, created_at,
        customer:customers(first_name, last_name),
        shipping_address:shipping_address_id(first_name, last_name, street, city, state, country, postal_code),
        billing_address:billing_address_id(first_name, last_name, street, city, state, country, postal_code),
        shipping_method:shipping_method_id(name),
        order_items(quantity, unit_price, product_snapshot)
      `)
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");
    if (current.payment_status !== "paid") {
      throw new Error(`Cannot deliver an order with payment status '${current.payment_status}'`);
    }
    if (current.fulfillment_status === "cancelled") {
      throw new ConflictError("Cannot deliver a cancelled order");
    }

    const { data: deliveredEvent } = await supabaseAdmin()
      .from("order_events")
      .select("id")
      .eq("order_id", orderId)
      .eq("event_type", "delivered")
      .maybeSingle();
    if (deliveredEvent) {
      await audit(admin, "MARK_DELIVERED_NOOP", "order", orderId, {});
      return { id: orderId };
    }

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ fulfillment_status: "fulfilled", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id")
      .single();
    if (error || !data) throw new NotFoundError("Order not found");

    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: "delivered",
      metadata: { source: "admin" },
      created_by: admin.sub,
    });
    await audit(admin, "MARK_DELIVERED", "order", orderId, {});

    // Email: orderDelivered (Maison luxury format - PDF 2 replication).
    try {
      const customer = Array.isArray(current.customer) ? current.customer[0] : current.customer;
      const shipping = Array.isArray(current.shipping_address) ? current.shipping_address[0] : current.shipping_address;
      const billing = Array.isArray(current.billing_address) ? current.billing_address[0] : current.billing_address;
      const shippingMethod = Array.isArray(current.shipping_method) ? current.shipping_method[0] : current.shipping_method;

      const snap = (current.order_items ?? []) as Array<{
        quantity: number;
        unit_price: number | string;
        product_snapshot?: {
          name?: string;
          options?: Array<{ name: string; value: string }>;
          primary_image?: string | null;
        };
      }>;
      const items = snap.map((it) => {
        const s = it.product_snapshot ?? {};
        return {
          name: s.name ?? "Item",
          variant: (s.options ?? []).map((o) => `${o.name}: ${o.value}`).join(" / ") || undefined,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          image_url: s.primary_image ?? null,
        };
      });

      const tpl = orderDeliveredEmail({
        customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
        orderNumber: current.order_number,
        orderPlacedDate: current.created_at,
        deliveryDate: new Date().toISOString(),
        deliveryMethod: shippingMethod?.name || "ups",
        shippingAddress: shipping ? {
          recipientName: [shipping.first_name, shipping.last_name].filter(Boolean).join(" ") || undefined,
          street: shipping.street ?? "",
          city: shipping.city ?? "",
          state: shipping.state ?? "",
          country: shipping.country ?? "",
          postal: shipping.postal_code ?? undefined,
        } : undefined,
        billingAddress: billing ? {
          recipientName: [billing.first_name, billing.last_name].filter(Boolean).join(" ") || undefined,
          street: billing.street ?? "",
          city: billing.city ?? "",
          state: billing.state ?? "",
          country: billing.country ?? "",
          postal: billing.postal_code ?? undefined,
        } : undefined,
        items,
        currency: (current.currency ?? "USD") as Currency,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com",
      });

      void sendEmail({
        to: current.customer_email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [
          { name: "type", value: "order_delivered" },
          { name: "order", value: current.order_number },
        ],
      });
    } catch (err) {
      logger.error({ err, orderId }, "orderDelivered email failed (non-blocking)");
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { id: data.id };
  });
}

/**
 * Mark an order as ready for pickup / collection point (Maison PDF 1 replication).
 */
export async function markReadyForPickupAction(
  orderId: string,
  _raw?: unknown,
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");

    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select(`
        id, payment_status, fulfillment_status, order_number, customer_email,
        customer:customers(first_name, last_name)
      `)
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");

    if (current.payment_status !== "paid") {
      throw new Error(`Cannot set ready for pickup for order with payment status '${current.payment_status}'`);
    }
    if (current.fulfillment_status === "cancelled") {
      throw new ConflictError("Cannot update a cancelled order");
    }

    await supabaseAdmin()
      .from("orders")
      .update({ fulfillment_status: "partially_fulfilled", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: "ready_for_pickup",
      metadata: { source: "admin" },
      created_by: admin.sub,
    });
    await audit(admin, "MARK_READY_FOR_PICKUP", "order", orderId, {});

    // Email: orderReadyForPickup (PDF 1 replication).
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
      const customer = Array.isArray(current.customer) ? current.customer[0] : current.customer;
      const tpl = orderReadyForPickupEmail({
        customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
        orderNumber: current.order_number,
        trackingUrl: `${siteUrl}/account/orders?order=${encodeURIComponent(current.order_number)}`,
        siteUrl,
      });

      void sendEmail({
        to: current.customer_email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [
          { name: "type", value: "order_ready_for_pickup" },
          { name: "order", value: current.order_number },
        ],
      });
    } catch (err) {
      logger.error({ err, orderId }, "orderReadyForPickup email failed (non-blocking)");
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { id: current.id };
  });
}

const noteSchema = z.object({ note: z.string().min(1).max(2000) });

export async function setInternalNoteAction(orderId: string, raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");
    const parsed = noteSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ internal_notes: parsed.data.note, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id")
      .single();
    if (error || !data) throw new NotFoundError("Order not found");

    await audit(admin, "SET_INTERNAL_NOTE", "order", orderId, { length: parsed.data.note.length });
    revalidatePath(`/admin/orders/${orderId}`);
    return { id: data.id };
  });
}

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
  restock: z.boolean().default(true),
});

export async function refundOrderAction(orderId: string, raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("refund_orders");
    const parsed = refundSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { amount, reason, restock } = parsed.data;

    const { data: order, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select("id, order_number, total, refunded_amount, payment_status, payment_reference, payment_gateway, currency, customer_email, customer:customers(first_name)")
      .eq("id", orderId)
      .single();
    if (readErr || !order) throw new NotFoundError("Order not found");

    const total = round2(Number(order.total));
    const alreadyRefunded = round2(Number(order.refunded_amount ?? 0));
    const remaining = round2(total - alreadyRefunded);

    if (order.payment_status === "refunded") {
      throw new ConflictError("Order is already fully refunded");
    }
    if (!["paid", "partially_refunded"].includes(order.payment_status)) {
      throw new ConflictError(`Cannot refund an order with payment status '${order.payment_status}'`);
    }
    if (remaining <= 0) {
      throw new ConflictError("No refundable amount remains on this order");
    }
    if (round2(amount) > remaining) {
      throw new ConflictError(
        `Refund of ${amount} exceeds the refundable balance of ${remaining.toFixed(2)} ${order.currency}`,
      );
    }
    if (!order.payment_reference) {
      throw new ConflictError("Order has no payment reference — refund cannot be routed to the gateway");
    }

    const isFull = round2(alreadyRefunded + amount) >= total;
    const newRefundedTotal = round2(alreadyRefunded + amount);

    // Call the gateway first. If it fails we abort before changing local
    // state, so a declined refund can never be recorded as issued.
    let gatewayRefundId: string | null = null;
    if (order.payment_gateway === "stripe") {
      try {
        const out = await refundPaymentIntent({
          paymentIntentId: order.payment_reference,
          amount,
          currency: order.currency as Currency,
          reason,
        });
        gatewayRefundId = out.refundId;
      } catch (err) {
        logger.error({ err, orderId, gateway: order.payment_gateway }, "gateway refund failed");
        throw new Error(`Gateway refund failed: ${(err as Error).message}`);
      }
    } else {
      throw new ConflictError(`Unknown payment_gateway: ${order.payment_gateway}`);
    }

    // Compare-and-set on refunded_amount: concurrent refund attempts cannot
    // both pass, so cumulative refunds can never exceed the order total.
    const { data: updated, error: updErr } = await supabaseAdmin()
      .from("orders")
      .update({
        refunded_amount: newRefundedTotal,
        payment_status: isFull ? "refunded" : "partially_refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("refunded_amount", alreadyRefunded)
      .select("id, payment_status")
      .single();
    if (updErr || !updated) {
      // The gateway refund DID succeed — surface this loudly so the operator
      // reconciles rather than blindly retrying (which would double-refund).
      logger.error(
        { orderId, gatewayRefundId, alreadyRefunded, amount },
        "refund state race after successful gateway refund — manual reconcile needed",
      );
      throw new ConflictError(
        "Another refund was recorded concurrently. The gateway refund was issued — check Stripe and reconcile before retrying.",
      );
    }

    // Restock once, only on the transition to fully-refunded.
    if (restock && isFull) {
      const { data: items } = await supabaseAdmin()
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", orderId);
      for (const item of items ?? []) {
        await restockVariant({
          variantId: item.variant_id,
          quantity: item.quantity,
          adminId: admin.sub,
          notes: `Refund of order ${order.order_number}`,
        });
      }
    }

    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: "refunded",
      metadata: {
        amount,
        refunded_total: newRefundedTotal,
        reason,
        restock,
        full: isFull,
        gateway_refund_id: gatewayRefundId,
      },
      created_by: admin.sub,
    });
    await audit(admin, "REFUND_ORDER", "order", orderId, {
      amount,
      refunded_total: newRefundedTotal,
      reason,
      restock,
      gatewayRefundId,
    });

    // Email: refundIssued (item 2.1.8).
    try {
      const tpl = refundIssuedEmail({
        customerName: (order as unknown as { customer?: { first_name?: string } }).customer?.first_name ?? undefined,
        orderNumber: order.order_number,
        amount,
        currency: (order.currency ?? "USD") as Currency,
        restock,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      });
      void sendEmail({
        to: order.customer_email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [
          { name: "type", value: "refund_issued" },
          { name: "order", value: order.order_number },
        ],
      });
    } catch (err) {
      logger.error({ err, orderId }, "refundIssued email failed (non-blocking)");
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return {
      id: orderId,
      status: updated.payment_status,
      refunded_total: newRefundedTotal,
      remaining: round2(total - newRefundedTotal),
    };
  });
}

/**
 * Cancel an order. Releases inventory back to the variants. Sets
 * payment_status = cancelled if not yet paid; otherwise the refund
 * action must be used.
 */
export async function cancelOrderAction(orderId: string): Promise<ActionResult<{ id: string; status: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");
    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select("id, payment_status, fulfillment_status, order_number, customer_email")
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");
    if (current.fulfillment_status === "cancelled") {
      return { id: orderId, status: current.fulfillment_status };
    }
    if (current.fulfillment_status === "fulfilled") {
      throw new ConflictError("Cannot cancel a fulfilled order. Use Refund instead.");
    }

    const updates: Record<string, unknown> = {
      fulfillment_status: "cancelled",
      updated_at: new Date().toISOString(),
    };
    if (current.payment_status !== "paid") updates.payment_status = "failed";

    // Conditional update: only the caller that actually flips the status to
    // cancelled proceeds to release inventory — repeated or racing cancels
    // cannot restock the same order twice.
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .neq("fulfillment_status", "cancelled")
      .select("id, fulfillment_status, payment_status")
      .single();
    if (error || !data) {
      // Someone else cancelled between our read and write — idempotent no-op.
      return { id: orderId, status: "cancelled" };
    }

    // Release inventory.
    try {
      await releaseInventory(orderId);
    } catch (err) {
      logger.error({ err, orderId }, "releaseInventory failed during cancel (continuing)");
    }

    await supabaseAdmin().from("order_events").insert({
      order_id: orderId,
      event_type: "cancelled",
      metadata: { source: "admin", released_inventory: true },
      created_by: admin.sub,
    });
    await audit(admin, "CANCEL_ORDER", "order", orderId, {});
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { id: data.id, status: data.fulfillment_status };
  });
}
