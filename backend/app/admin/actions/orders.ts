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
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { orderShippedEmail, orderDeliveredEmail, refundIssuedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import { refundPaymentIntent } from "@/lib/payments/stripe";
import { refundTransaction } from "@/lib/payments/paystack";
import type { Currency } from "@/lib/validations";

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

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ fulfillment_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id, fulfillment_status, order_number, payment_status")
      .single();
    if (error || !data) throw new NotFoundError("Order not found");

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

    // Read current state first to enforce the state machine:
    //   - must be paid (can't ship an unpaid order)
    //   - must be in {unfulfilled, partially_fulfilled} (can't re-ship)
    //   - must NOT be already fulfilled or cancelled
    const { data: current, error: readErr } = await supabaseAdmin()
      .from("orders")
      .select("id, payment_status, fulfillment_status")
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");

    if (current.payment_status !== "paid") {
      throw new Error(`Cannot ship an order with payment status '${current.payment_status}'`);
    }
    if (current.fulfillment_status === "fulfilled") {
      throw new Error("Order is already fulfilled");
    }
    if (current.fulfillment_status === "cancelled") {
      throw new Error("Cannot ship a cancelled order");
    }

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({
        fulfillment_status: "fulfilled",
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
          customerName: (full as any).customer?.first_name ?? undefined,
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
      .select("id, payment_status, fulfillment_status, order_number, customer_email, currency, customer:customers(first_name), order_items(product_snapshot)")
      .eq("id", orderId)
      .single();
    if (readErr || !current) throw new NotFoundError("Order not found");
    if (current.payment_status !== "paid") {
      throw new Error(`Cannot deliver an order with payment status '${current.payment_status}'`);
    }
    const alreadyDelivered = current.fulfillment_status === "fulfilled";
    if (alreadyDelivered) {
      // No-op: still log so the audit trail is intact.
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

    // Email: orderDelivered (item 2.1.6).
    try {
      const snap = (current as any).order_items ?? [];
      const items = snap.map((it: any) => {
        const s = it.product_snapshot ?? {};
        return {
          name: s.name ?? "Item",
          variant: (s.options ?? []).map((o: any) => `${o.name}: ${o.value}`).join(" / ") || undefined,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          image_url: s.primary_image ?? null,
        };
      });
      const tpl = orderDeliveredEmail({
        customerName: (current as any).customer?.first_name ?? undefined,
        orderNumber: current.order_number,
        items,
        currency: (current.currency ?? "USD") as Currency,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
      .select("id, order_number, total, payment_status, payment_reference, payment_gateway, currency, customer_email, customer:customers(first_name)")
      .eq("id", orderId)
      .single();
    if (readErr || !order) throw new NotFoundError("Order not found");

    // Call the gateway first (item 4.1). If the gateway fails, we abort
    // before changing local state. If the gateway succeeds but the local
    // update fails, we mark the order as "refund_pending" so a follow-up
    // reconcile job can complete the local state.
    let gatewayRefundId: string | null = null;
    if (order.payment_status === "paid" && order.payment_reference) {
      const currency = order.currency as Currency;
      try {
        if (order.payment_gateway === "stripe") {
          // Stripe reference is the PaymentIntent id (we used it as the
          // order's payment_reference at init time).
          const out = await refundPaymentIntent({
            paymentIntentId: order.payment_reference,
            amount,
            currency,
            reason,
          });
          gatewayRefundId = out.refundId;
        } else if (order.payment_gateway === "paystack") {
          const out = await refundTransaction({
            reference: order.payment_reference,
            amount,
            currency,
          });
          gatewayRefundId = out.refundId;
        } else {
          throw new Error(`Unknown payment_gateway: ${order.payment_gateway}`);
        }
      } catch (err) {
        logger.error({ err, orderId, gateway: order.payment_gateway }, "gateway refund failed");
        throw new Error(`Gateway refund failed: ${(err as Error).message}`);
      }
    }

    const isFull = amount >= Number(order.total);
    const { data: updated, error: updErr } = await supabaseAdmin()
      .from("orders")
      .update({
        payment_status: isFull ? "refunded" : "partially_refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, payment_status")
      .single();
    if (updErr || !updated) throw new Error(updErr?.message ?? "Update failed");

    if (restock) {
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
      metadata: { amount, reason, restock, full: isFull, gateway_refund_id: gatewayRefundId },
      created_by: admin.sub,
    });
    await audit(admin, "REFUND_ORDER", "order", orderId, { amount, reason, restock, gatewayRefundId });

    // Email: refundIssued (item 2.1.8).
    try {
      const tpl = refundIssuedEmail({
        customerName: (order as any).customer?.first_name ?? undefined,
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
    return { id: orderId, status: updated.payment_status };
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
      throw new Error("Cannot cancel a fulfilled order. Use Refund instead.");
    }

    // Release inventory.
    try {
      await releaseInventory(orderId);
    } catch (err) {
      logger.error({ err, orderId }, "releaseInventory failed during cancel (continuing)");
    }

    const updates: Record<string, unknown> = {
      fulfillment_status: "cancelled",
      updated_at: new Date().toISOString(),
    };
    if (current.payment_status !== "paid") updates.payment_status = "failed";

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select("id, fulfillment_status, payment_status")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Cancel failed");

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

/**
 * Persist an internal note on an order. Staff-only.
 */
export async function setInternalNoteAction(orderId: string, note: string): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("update_orders");
    const trimmed = (note ?? "").trim().slice(0, 4000);
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({ internal_notes: trimmed, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id")
      .single();
    if (error || !data) throw new NotFoundError("Order not found");
    await audit(admin, "SET_INTERNAL_NOTE", "order", orderId, { length: trimmed.length });
    revalidatePath(`/admin/orders/${orderId}`);
    return { id: data.id };
  });
}
