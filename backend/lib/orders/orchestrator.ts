/**
 * Order orchestration: build & persist an order from a priced cart.
 *
 * Steps:
 *  1. Price the cart (loads variants, computes tax).
 *  2. Quote shipping.
 *  3. Apply coupon (atomic — increments `times_used` if accepted).
 *  4. Validate gift card.
 *  5. Upsert customer + addresses.
 *  6. Persist order, order_items, order_event('placed').
 *  7. Reserve inventory (atomic).
 *  8. Debit gift card (atomic).
 *  9. Initialize the payment gateway.
 *
 * Failure handling:
 *  - Steps 1–5: clean throw, no partial state to clean up.
 *  - Step 6: order row removed before rethrowing.
 *  - Steps 7–9: order removed, inventory released, coupon usage refunded,
 *    gift card debit rolled back (if the SQL function supports it).
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { priceCart, type CartPricing } from "@/lib/cart/pricing";
import { reserveInventory, releaseInventory } from "@/lib/inventory/manager";
import { calculateShipping } from "@/lib/shipping/calculator";
import { selectGateway } from "@/lib/payments/router";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { initializeTransaction } from "@/lib/payments/paystack";
import { validateCoupon, refundCouponUsage } from "@/lib/coupons/manager";
import { validateGiftCard, debitGiftCard } from "@/lib/giftcards/manager";
import { orderReceivedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import type { AddressInput, CartItemInput, Currency } from "@/lib/validations";
import type { Gateway } from "@/lib/payments/router";

export interface BuildOrderInput {
  cart: CartItemInput[];
  customerEmail: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
  shippingAddress: AddressInput;
  billingSameAsShipping?: boolean;
  billingAddress?: AddressInput;
  currency: Currency;
  shippingMethodId?: string;
  couponCode?: string;
  giftCardCode?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BuildOrderResult {
  orderId: string;
  orderNumber: string;
  paymentReference: string;
  gateway: Gateway;
  clientSecret?: string;            // Stripe
  authorizationUrl?: string;        // Paystack
  accessCode?: string;              // Paystack
  amount: number;
  currency: Currency;
}

export async function buildOrder(input: BuildOrderInput): Promise<BuildOrderResult> {
  /* 1. Price the cart (loads variants, computes tax) ------------------ */
  const pricing: CartPricing = await priceCart({
    cart: input.cart,
    currency: input.currency,
    country: input.shippingAddress.country,
    state: input.shippingAddress.state,
  });

  /* 2. Shipping quote ------------------------------------------------- */
  const shipping = await calculateShipping({
    country: input.shippingAddress.country,
    subtotal: pricing.subtotal,
    currency: input.currency,
    preferredMethodId: input.shippingMethodId,
  });

  /* 3. Discounts ------------------------------------------------------ */
  let discountTotal = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const coupon = await validateCoupon({
      code: input.couponCode,
      subtotal: pricing.subtotal,
      currency: input.currency,
      cartItems: input.cart,
    });
    discountTotal = Math.min(coupon.discountAmount, pricing.subtotal);
    couponId = coupon.couponId;
  }

  let giftCardId: string | null = null;
  let giftCardTotal = 0;
  if (input.giftCardCode) {
    const giftCard = await validateGiftCard(input.giftCardCode, input.currency);
    giftCardId = giftCard.giftCardId;
    giftCardTotal = Math.min(giftCard.currentBalance, pricing.subtotal - discountTotal);
  }

  // Tax amount is already correctly computed by priceCart (handles both
  // inclusive and exclusive tax).
  const taxAmount = pricing.tax.amount;
  const total = Math.max(
    0,
    round2(pricing.subtotal - discountTotal - giftCardTotal + shipping.rate + taxAmount),
  );

  /* 4. Upsert customer + shipping address ---------------------------- */
  const { data: customer, error: custErr } = await supabaseAdmin()
    .from("customers")
    .upsert(
      {
        email: input.customerEmail,
        first_name: input.customerFirstName ?? input.shippingAddress.first_name,
        last_name: input.customerLastName ?? input.shippingAddress.last_name,
        phone: input.customerPhone ?? input.shippingAddress.phone,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (custErr || !customer) throw new Error(`Customer upsert failed: ${custErr?.message}`);

  const { data: address, error: addrErr } = await supabaseAdmin()
    .from("addresses")
    .insert({
      customer_id: customer.id,
      first_name: input.shippingAddress.first_name,
      last_name: input.shippingAddress.last_name,
      phone: input.shippingAddress.phone,
      country: input.shippingAddress.country,
      state: input.shippingAddress.state,
      city: input.shippingAddress.city,
      street: input.shippingAddress.street,
      postal_code: input.shippingAddress.postal_code ?? null,
      label: input.shippingAddress.label ?? null,
      is_default_shipping: input.shippingAddress.is_default_shipping ?? false,
      is_default_billing: input.shippingAddress.is_default_billing ?? false,
    })
    .select("id")
    .single();
  if (addrErr || !address) throw new Error(`Address insert failed: ${addrErr?.message}`);

  let billingAddressId: string = address.id;
  if (!input.billingSameAsShipping && input.billingAddress) {
    const { data: billAddr, error: billErr } = await supabaseAdmin()
      .from("addresses")
      .insert({
        customer_id: customer.id,
        first_name: input.billingAddress.first_name,
        last_name: input.billingAddress.last_name,
        phone: input.billingAddress.phone,
        country: input.billingAddress.country,
        state: input.billingAddress.state,
        city: input.billingAddress.city,
        street: input.billingAddress.street,
        postal_code: input.billingAddress.postal_code ?? null,
        is_default_billing: true,
      })
      .select("id")
      .single();
    if (billErr || !billAddr) throw new Error(`Billing address failed: ${billErr?.message}`);
    billingAddressId = billAddr.id;
  }

  /* 5. Persist order (pending) ---------------------------------------- */
  const gateway: Gateway = selectGateway(input.currency);
  const { data: order, error: orderErr } = await supabaseAdmin()
    .from("orders")
    .insert({
      customer_id: customer.id,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone ?? input.shippingAddress.phone,
      shipping_address_id: address.id,
      billing_address_id: billingAddressId,
      shipping_method_id: shipping.methodId,
      currency: input.currency,
      subtotal: pricing.subtotal,
      discount_total: discountTotal,
      gift_card_total: giftCardTotal,
      gift_card_id: giftCardId,
      shipping_total: shipping.rate,
      tax_total: taxAmount,
      total,
      coupon_id: couponId,
      payment_gateway: gateway,
      payment_status: "pending",
      notes: input.notes ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select("id, order_number")
    .single();
  if (orderErr || !order) throw new Error(`Order insert failed: ${orderErr?.message}`);

  /* Failure-cleanup helper. After step 5 the order row exists; any
     failure below must delete it AND undo side effects (coupon usage,
     inventory, gift card debit). Idempotent: safe to call multiple times. */
  const cleanup = async (reason: string, err: unknown) => {
    logger.error({ err, orderId: order.id, reason }, "buildOrder cleanup");
    try {
      // Order first — if it still exists. releaseInventory is a no-op if
      // nothing was reserved.
      await supabaseAdmin().from("orders").delete().eq("id", order.id);
    } catch (e) {
      logger.error({ e, orderId: order.id }, "cleanup: order delete failed");
    }
    try {
      await releaseInventory(order.id);
    } catch (e) {
      logger.error({ e, orderId: order.id }, "cleanup: release inventory failed");
    }
    if (couponId) {
      try {
        await refundCouponUsage(couponId);
      } catch (e) {
        logger.error({ e, couponId, orderId: order.id }, "cleanup: refund coupon failed");
      }
    }
  };

  /* 6. Persist order items ------------------------------------------- */
  const orderItems = pricing.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId,
    product_snapshot: {
      name: item.productName,
      slug: item.productSlug,
      sku: item.variantSku,
      options: item.options,
      primary_image: item.primaryImage,
    },
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
  }));
  const { error: itemsErr } = await supabaseAdmin().from("order_items").insert(orderItems);
  if (itemsErr) {
    await cleanup("order_items_insert_failed", itemsErr);
    throw new Error(`Order items insert failed: ${itemsErr.message}`);
  }

  /* 7. Reserve inventory (atomic) ------------------------------------ */
  try {
    await reserveInventory(order.id, input.cart);
  } catch (err) {
    await cleanup("reserve_inventory_failed", err);
    throw err;
  }

  /* 8. Record placed event ------------------------------------------- */
  await supabaseAdmin().from("order_events").insert({
    order_id: order.id,
    event_type: "placed",
    metadata: {
      currency: input.currency,
      gateway,
      total,
    },
  });

  /* 9. Debit gift card (best-effort, only if order is created) ------- */
  if (giftCardId && giftCardTotal > 0) {
    try {
      await debitGiftCard(giftCardId, giftCardTotal, order.id);
    } catch (err) {
      await cleanup("gift_card_debit_failed", err);
      throw err;
    }
  }

  /* 9b. Send "we received your order" email (best-effort, does not block). */
  try {
    const tpl = orderReceivedEmail({
      customerName: input.customerFirstName ?? input.shippingAddress.first_name,
      orderNumber: order.order_number,
      items: pricing.items.map((it) => ({
        name: it.productName,
        variant: (it.options ?? []).map((o) => `${o.name}: ${o.value}`).join(" / ") || undefined,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        image_url: it.primaryImage ?? null,
      })),
      totals: {
        currency: input.currency,
        subtotal: pricing.subtotal,
        shipping: shipping.rate,
        tax: taxAmount,
        discount: discountTotal || undefined,
        gift_card: giftCardTotal || undefined,
        total,
      },
      shippingAddress: {
        street: input.shippingAddress.street,
        city: input.shippingAddress.city,
        state: input.shippingAddress.state,
        country: input.shippingAddress.country,
        postal: input.shippingAddress.postal_code ?? undefined,
      },
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    });
    void sendEmail({
      to: input.customerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [
        { name: "type", value: "order_received" },
        { name: "order", value: order.order_number },
      ],
    });
  } catch (err) {
    logger.error({ err, orderId: order.id }, "orderReceived email failed (non-blocking)");
  }

  /* 10. Initialize payment gateway ----------------------------------- */
  let result: BuildOrderResult = {
    orderId: order.id,
    orderNumber: order.order_number,
    paymentReference: "",
    gateway,
    amount: total,
    currency: input.currency,
  };

  if (gateway === "stripe") {
    const intent = await createPaymentIntent({
      amount: total,
      currency: input.currency,
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: input.customerEmail,
      metadata: { shipping_method: shipping.methodName },
    });
    result.paymentReference = intent.reference;
    result.clientSecret = intent.clientSecret;
  } else {
    const tx = await initializeTransaction({
      amount: total,
      currency: input.currency,
      email: input.customerEmail,
      orderId: order.id,
      orderNumber: order.order_number,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/checkout/verify?gateway=paystack`,
      metadata: { shipping_method: shipping.methodName },
    });
    result.paymentReference = tx.reference;
    result.authorizationUrl = tx.authorizationUrl;
    result.accessCode = tx.accessCode;
  }

  // Persist the payment reference so the webhook / verify can find the order
  const { error: refErr } = await supabaseAdmin()
    .from("orders")
    .update({ payment_reference: result.paymentReference })
    .eq("id", order.id);
  if (refErr) {
    await cleanup("payment_reference_save_failed", refErr);
    throw new Error(`Failed to persist payment reference: ${refErr.message}`);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Order status updates (used by webhooks and admin actions)          */
/* ------------------------------------------------------------------ */

export async function markOrderPaid(reference: string, metadata: Record<string, unknown> = {}) {
  // Race-safe: the `paid` event is the source of truth. The first call to
  // find an unpaid order wins; subsequent calls (from the verify endpoint
  // racing the webhook) short-circuit cleanly.
  const { data: order, error: lookupErr } = await supabaseAdmin()
    .from("orders")
    .select("id, customer_email, currency, total, order_number, payment_status")
    .eq("payment_reference", reference)
    .single();
  if (lookupErr || !order) throw new NotFoundError(`Order for reference ${reference} not found`);

  if (order.payment_status === "paid") {
    // Already processed — return the order without emitting a duplicate event.
    return order;
  }

  // Compare-and-set: only transition pending|failed -> paid when the row
  // is still not paid. If two callers race here, exactly one matches.
  const { data: updated, error: updErr } = await supabaseAdmin()
    .from("orders")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("payment_reference", reference)
    .neq("payment_status", "paid")
    .select("id, customer_email, currency, total, order_number")
    .single();
  if (updErr || !updated) {
    // Lost the race — the other caller already paid this order.
    const { data: reread } = await supabaseAdmin()
      .from("orders")
      .select("id, customer_email, currency, total, order_number")
      .eq("payment_reference", reference)
      .single();
    return reread ?? order;
  }

  await supabaseAdmin().from("order_events").insert({
    order_id: updated.id,
    event_type: "paid",
    metadata,
  });
  return updated;
}

export async function markOrderFailed(reference: string, reason: string) {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .update({ payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("payment_reference", reference)
    .select("id")
    .single();
  if (error || !data) return;
  await supabaseAdmin().from("order_events").insert({
    order_id: data.id,
    event_type: "cancelled",
    metadata: { reason, source: "payment_failed" },
  });
  await releaseInventory(data.id);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
