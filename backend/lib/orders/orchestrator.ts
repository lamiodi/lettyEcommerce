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
import { toMinorUnits } from "@/lib/utils/currency";
import { priceCart, type CartPricing } from "@/lib/cart/pricing";
import { reserveInventory, releaseInventory } from "@/lib/inventory/manager";
import { calculateShipping } from "@/lib/shipping/calculator";
import { selectGateway } from "@/lib/payments/router";
import { createPaymentIntent } from "@/lib/payments/stripe";
import { roundPrice } from "@/lib/currency/fx";
import { validateCoupon, refundCouponUsage, reapplyCouponUsage } from "@/lib/coupons/manager";
import { getAuthenticatedCustomer } from "@/lib/auth/customer";
import { validateGiftCard, debitGiftCard, creditGiftCardBalance } from "@/lib/giftcards/manager";
import type { AddressInput, CartItemInput, Currency } from "@/lib/validations";
import type { Gateway } from "@/lib/payments/router";

export interface BuildOrderInput {
  cart: CartItemInput[];
  customerEmail: string;
  customerPhone?: string | null;
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
    // Patron-only coupons and per-customer usage limits are enforced against
    // the session cookie identity — never a client-supplied id. buildOrder
    // runs inside the checkout/init route handler, so cookies() is available.
    const authCustomer = await getAuthenticatedCustomer();
    const coupon = await validateCoupon({
      code: input.couponCode,
      subtotal: pricing.subtotal,
      currency: input.currency,
      cartItems: input.cart,
      customerId: authCustomer?.sub,
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

  // Tax amount is already correctly computed by priceCart. INCLUSIVE tax
  // (UK/EU VAT on retail prices) is already inside `subtotal` — adding
  // taxAmount here would charge VAT twice. It only adds on top for
  // EXCLUSIVE jurisdictions. `tax_total` still records the VAT portion for
  // reporting either way.
  const taxAmount = pricing.tax.amount;
  const total = Math.max(
    0,
    roundPrice(
      pricing.subtotal -
        discountTotal -
        giftCardTotal +
        shipping.rate +
        (pricing.tax.isInclusive ? 0 : taxAmount),
      input.currency,
    ),
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

  // Safely demote existing default addresses to avoid violating unique partial indexes
  if (input.shippingAddress.is_default_shipping) {
    await supabaseAdmin()
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("customer_id", customer.id)
      .eq("is_default_shipping", true);
  }
  if (input.shippingAddress.is_default_billing) {
    await supabaseAdmin()
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("customer_id", customer.id)
      .eq("is_default_billing", true);
  }

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
    await supabaseAdmin()
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("customer_id", customer.id)
      .eq("is_default_billing", true);

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
  const isUuid = (val?: string | null) =>
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const isValidIp = (ip?: string | null) => {
    if (!ip || typeof ip !== "string") return false;
    const trimmed = ip.trim();
    if (trimmed === "anonymous" || trimmed === "localhost" || trimmed.includes("unknown")) return false;
    if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(trimmed)) return true;
    if (/^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.includes(":")) return true;
    return false;
  };

  // Retry on order-number unique collisions (23505): the DB sequence
  // generates compact 8-character Maison order numbers (L0XXXXXX) with loop
  // collision guards; a retry here turns any race condition into a
  // transparent extra ~1ms attempt.
  let order: { id: string; order_number: string } | null = null;
  let orderErr: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const res = await supabaseAdmin()
      .from("orders")
      .insert({
        customer_id: customer.id,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone ?? input.shippingAddress.phone,
        shipping_address_id: address.id,
        billing_address_id: billingAddressId,
        shipping_method_id: isUuid(shipping.methodId) ? shipping.methodId : null,
        currency: input.currency,
        subtotal: pricing.subtotal,
        discount_total: discountTotal,
        gift_card_total: giftCardTotal,
        gift_card_id: isUuid(giftCardId) ? giftCardId : null,
        shipping_total: shipping.rate,
        tax_total: taxAmount,
        total,
        coupon_id: isUuid(couponId) ? couponId : null,
        payment_gateway: gateway,
        payment_status: "pending",
        notes: input.notes ?? null,
        ip_address: isValidIp(input.ipAddress) ? input.ipAddress!.trim() : null,
        user_agent: input.userAgent ?? null,
      })
      .select("id, order_number")
      .single();
    order = res.data;
    orderErr = (res.error as { code?: string; message?: string } | null) ?? null;
    if (!order && orderErr?.code !== "23505") break;
  }
  if (orderErr || !order) throw new Error(`Order insert failed: ${orderErr?.message}`);

  // Set once the gift-card debit (step 9) succeeds, so cleanup knows the
  // balance actually left the card and must be given back.
  let giftCardDebited = false;

  /* Failure-cleanup helper. After step 5 the order row exists; any
     failure below must delete it AND undo side effects (coupon usage,
     inventory, gift card debit). Idempotent: safe to call multiple times.
     Inventory is released BEFORE the order row is deleted — release_inventory
     reads order_items, which cascade-delete with the order. */
  const cleanup = async (reason: string, err: unknown) => {
    logger.error({ err, orderId: order.id, reason }, "buildOrder cleanup");
    try {
      await releaseInventory(order.id);
    } catch (e) {
      logger.error({ e, orderId: order.id }, "cleanup: release inventory failed");
    }
    if (giftCardDebited && giftCardId && giftCardTotal > 0) {
      // Must run BEFORE the order delete: the gift-card ledger row
      // references the order.
      try {
        await creditGiftCardBalance({ giftCardId, amount: giftCardTotal, orderId: order.id });
      } catch (e) {
        logger.error({ e, giftCardId, orderId: order.id }, "cleanup: gift card re-credit failed");
      }
    }
    try {
      await supabaseAdmin().from("orders").delete().eq("id", order.id);
    } catch (e) {
      logger.error({ e, orderId: order.id }, "cleanup: order delete failed");
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
      giftCardDebited = true;
    } catch (err) {
      await cleanup("gift_card_debit_failed", err);
      throw err;
    }
  }

  /* 9b. (No "order received" email here.) For the synchronous Stripe flow
     the paid-order confirmation from post-payment arrives seconds later —
     sending both was pure duplication. Failed payments get
     paymentFailedEmail from the webhook; abandoned checkouts are covered by
     the abandoned-cart reminder. */

  /* 10. Initialize payment gateway (Stripe) ------------------------- */
  let intent: Awaited<ReturnType<typeof createPaymentIntent>>;
  try {
    intent = await createPaymentIntent({
      amount: total,
      currency: input.currency,
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: input.customerEmail,
      metadata: { shipping_method: shipping.methodName },
    });
  } catch (err) {
    // No PaymentIntent → nothing for the webhook, verify or the expiry sweep
    // to key on (they all match on payment_reference). Clean up now or the
    // reserved stock, coupon use and gift-card debit leak forever.
    await cleanup("payment_intent_creation_failed", err);
    throw err;
  }

  const result: BuildOrderResult = {
    orderId: order.id,
    orderNumber: order.order_number,
    paymentReference: intent.reference,
    gateway,
    clientSecret: intent.clientSecret,
    amount: total,
    currency: input.currency,
  };

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

export interface PaymentValidationDetails {
  amountMinor?: number;
  currency?: string;
  livemode?: boolean;
}

export async function markOrderPaid(
  reference: string,
  metadata: Record<string, unknown> = {},
  validation?: PaymentValidationDetails,
) {
  // Race-safe: the `paid` event is the source of truth. The first call to
  // find an unpaid order wins; subsequent calls (from the verify endpoint
  // racing the webhook) short-circuit cleanly.
  const { data: order, error: lookupErr } = await supabaseAdmin()
    .from("orders")
    .select("id, customer_email, currency, total, order_number, payment_status, fulfillment_status")
    .eq("payment_reference", reference)
    .single();
  if (lookupErr || !order) throw new NotFoundError(`Order for reference ${reference} not found`);

  // Verify payment parameters before marking as paid
  if (validation) {
    if (validation.currency && validation.currency.toLowerCase() !== order.currency.toLowerCase()) {
      throw new ConflictError(
        `Payment currency mismatch: expected ${order.currency}, received ${validation.currency}`,
      );
    }
    if (typeof validation.amountMinor === "number") {
      const expectedMinor = toMinorUnits(Number(order.total), order.currency as Currency);
      if (validation.amountMinor !== expectedMinor) {
        throw new ConflictError(
          `Payment amount mismatch: expected ${expectedMinor} minor units, received ${validation.amountMinor}`,
        );
      }
    }
    if (typeof validation.livemode === "boolean") {
      const secretKey = process.env.STRIPE_SECRET_KEY || "";
      const isServerLive = secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
      if (validation.livemode !== isServerLive) {
        throw new ConflictError(
          `Payment mode mismatch: event livemode is ${validation.livemode} but server is running in ${isServerLive ? "live" : "test"} mode`,
        );
      }
    }
  }

  if (order.payment_status === "paid") {
    // Already processed — return the order without emitting a duplicate event.
    return order;
  }

  if (order.fulfillment_status === "cancelled") {
    // Admin (or the expiry sweep) cancelled this order and cancelled the
    // PaymentIntent with it. Accepting a payment here would resurrect a dead
    // order whose stock and entitlements are already released — the webhook
    // caller catches this so Stripe stops retrying; the charge is refunded
    // manually.
    throw new ConflictError(`Order ${order.order_number} is cancelled — refusing payment`);
  }

  // Compare-and-set: only transition pending|failed -> paid when the row
  // is still not paid. If two callers race here, exactly one matches.
  const { data: updated, error: updErr } = await supabaseAdmin()
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("payment_reference", reference)
    .neq("payment_status", "paid")
    .neq("fulfillment_status", "cancelled")
    .select("id, customer_email, currency, total, order_number, coupon_id, gift_card_id, gift_card_total")
    .single();
  if (updErr || !updated) {
    // Lost the race — either another caller already paid this order, or it
    // was cancelled between our read and the compare-and-set.
    const { data: reread } = await supabaseAdmin()
      .from("orders")
      .select("id, customer_email, currency, total, order_number, payment_status, fulfillment_status")
      .eq("payment_reference", reference)
      .single();
    if (reread?.fulfillment_status === "cancelled") {
      throw new ConflictError(`Order ${reread.order_number} is cancelled — refusing payment`);
    }
    return reread ?? order;
  }

  await supabaseAdmin().from("order_events").insert({
    order_id: updated.id,
    event_type: "paid",
    metadata,
  });

  if (order.payment_status === "failed") {
    // A declined attempt already released stock and entitlements; the
    // customer retried the same PaymentIntent and it succeeded. Put the
    // coupon use and gift-card debit back before fulfillment runs.
    await reapplyOrderEntitlements(updated);
  }
  return updated;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Give back what a not-completed order consumed: the coupon use burned at
 * checkout/init and the gift-card balance debited at order build. Called on
 * the first pending → failed/cancelled transition only (callers guard with a
 * compare-and-set), so it cannot double-refund.
 */
export async function releaseOrderEntitlements(order: {
  id: string;
  coupon_id?: string | null;
  gift_card_id?: string | null;
  gift_card_total?: number | string | null;
}): Promise<void> {
  if (order.coupon_id && UUID_RE.test(order.coupon_id)) {
    try {
      await refundCouponUsage(order.coupon_id);
    } catch (e) {
      logger.error({ e, couponId: order.coupon_id, orderId: order.id }, "coupon usage refund failed");
    }
  }
  const giftCardTotal = Number(order.gift_card_total ?? 0);
  if (order.gift_card_id && UUID_RE.test(order.gift_card_id) && giftCardTotal > 0) {
    try {
      await creditGiftCardBalance({
        giftCardId: order.gift_card_id,
        amount: giftCardTotal,
        orderId: order.id,
      });
    } catch (e) {
      logger.error({ e, giftCardId: order.gift_card_id, orderId: order.id }, "gift card re-credit failed");
    }
  }
}

/**
 * Re-apply what releaseOrderEntitlements gave back, for the failed order
 * whose payment later succeeded (customer retried the same PaymentIntent
 * after a declined attempt). Runs exactly once per failed → paid transition
 * — the compare-and-set in markOrderPaid is the only caller. Best-effort:
 * the money is already taken, so a failed re-debit is logged, never thrown.
 */
export async function reapplyOrderEntitlements(order: {
  id: string;
  coupon_id?: string | null;
  gift_card_id?: string | null;
  gift_card_total?: number | string | null;
}): Promise<void> {
  if (order.coupon_id && UUID_RE.test(order.coupon_id)) {
    try {
      await reapplyCouponUsage(order.coupon_id);
    } catch (e) {
      logger.error({ e, couponId: order.coupon_id, orderId: order.id }, "coupon usage re-burn failed");
    }
  }
  const giftCardTotal = Number(order.gift_card_total ?? 0);
  if (order.gift_card_id && UUID_RE.test(order.gift_card_id) && giftCardTotal > 0) {
    try {
      await debitGiftCard(order.gift_card_id, giftCardTotal, order.id);
    } catch (e) {
      logger.error({ e, giftCardId: order.gift_card_id, orderId: order.id }, "gift card re-debit failed");
    }
  }
}

/**
 * Shared pending → failed transition. Only a pending order may be failed: a
 * payment that actually succeeded is never undone by a late failure event,
 * and an already-failed order must not release its side effects twice
 * (Stripe sends one payment_failed event per declined attempt). The
 * compare-and-set makes exactly one racing caller proceed, so coupon /
 * gift-card release and inventory release run exactly once.
 */
async function failPendingOrder(
  order: {
    id: string;
    payment_status: string;
    coupon_id: string | null;
    gift_card_id: string | null;
    gift_card_total: number | string | null;
  },
  reason: string,
  source: string,
): Promise<void> {
  if (order.payment_status !== "pending") {
    logger.warn(
      { orderId: order.id, status: order.payment_status, reason },
      "markOrderFailed ignored: order is not pending",
    );
    return;
  }

  const { data: updated, error } = await supabaseAdmin()
    .from("orders")
    .update({ payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("payment_status", order.payment_status)
    .select("id")
    .single();
  if (error || !updated) return;

  await releaseOrderEntitlements(order);

  await supabaseAdmin().from("order_events").insert({
    order_id: order.id,
    event_type: "cancelled",
    metadata: { reason, source },
  });
  try {
    await releaseInventory(order.id);
  } catch (e) {
    logger.error({ e, orderId: order.id }, "releaseInventory failed during markOrderFailed");
  }
}

export async function markOrderFailed(reference: string, reason: string) {
  const { data: order } = await supabaseAdmin()
    .from("orders")
    .select("id, payment_status, coupon_id, gift_card_id, gift_card_total")
    .eq("payment_reference", reference)
    .single();
  if (!order) return;
  await failPendingOrder(order, reason, "payment_failed");
}

/**
 * Fail a pending order by primary key — for orders that never got a
 * payment_reference (Stripe init died mid-build before the cleanup wrap) and
 * therefore cannot be looked up — or cancelled — by reference.
 */
export async function markOrderFailedById(
  orderId: string,
  reason: string,
  source = "payment_failed",
) {
  const { data: order } = await supabaseAdmin()
    .from("orders")
    .select("id, payment_status, coupon_id, gift_card_id, gift_card_total")
    .eq("id", orderId)
    .single();
  if (!order) return;
  await failPendingOrder(order, reason, source);
}

