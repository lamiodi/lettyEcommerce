/**
 * Email templates — Maison LETTY aesthetic.
 *
 * Every template builds its own `body` HTML (no <html>/<head>/<body>) and
 * defers to `renderMaisonEmailLayout()` (in ./layout.ts) for the shared
 * shell (nav, banner, customer-care box, perks bar, footer). This guarantees
 * the brand emblem is present in every email and the typography stays
 * consistent across the whole catalog.
 *
 * Adding a new template:
 *   1. Build the `body` string with Maison styling (Georgia greeting,
 *      MAISON_COLORS palette, maisonLineButton for CTAs).
 *   2. Call `renderMaisonEmailLayout({ body, text, subject, preheader,
 *      siteUrl, webviewUrl })` — owner alerts additionally pass
 *      showNav/showCustomerCare/showPerks/showFooter = false.
 *   3. Export a function that takes typed props and returns the layout
 *      result, so callers (post-payment job, abandoned-cart job, admin
 *      actions) get a fully-rendered email.
 */
import { formatMoney, type Currency } from "@/lib/utils/currency";
import { MAISON_COLORS, formatEmailImageUrl } from "./brand";
import {
  renderMaisonEmailLayout,
  maisonLineButton,
  maisonRatingScale,
  maisonOrderInfoGrid,
  escapeHtml,
} from "./layout";

/* ---------------------------------------------------------------------- */
/*  Order line items + totals                                             */
/* ---------------------------------------------------------------------- */

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  variant?: string;
  image_url?: string | null;
}

export interface OrderTotals {
  currency: Currency;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  gift_card?: number;
  /** True for VAT-inclusive jurisdictions: the tax is already inside the
   *  prices, so the row is labelled "Tax (included)" rather than additive. */
  taxIncluded?: boolean;
  total: number;
}

/* ====================================================================== */
/*  v1 TEMPLATES — 10 total (see fix/leave review §2)                     */
/* ====================================================================== */

/* (2.A orderReceived removed — the paid-order confirmation email is the
      single receipt; payment failures get paymentFailedEmail.)

/* ---------- 2.B — orderConfirmation ---------------------------------- */

export interface OrderConfirmationProps {
  customerName?: string;
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  orderDate?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  trackingUrl?: string;
  siteUrl: string;
}

export interface OrderAddress {
  recipientName?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal?: string;
}

function editorialAddress(address: OrderAddress): string {
  const location = [address.city, address.state, address.postal]
    .filter((part): part is string => Boolean(part))
    .join(", ");
  return [address.recipientName, address.street, location, address.country]
    .filter((line): line is string => Boolean(line))
    .map(escapeHtml)
    .join("<br>");
}

function editorialOrderItems(items: OrderItem[], currency: Currency, siteUrl: string): string {
  const rows = items.map((item) => {
    const src = formatEmailImageUrl(item.image_url, siteUrl);
    const image = src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.name)}" width="88" height="104" style="display:block;width:88px;height:104px;object-fit:cover;border:1px solid #E8E2D9;border-radius:4px;background:#FAF7F2;">`
      : `<span style="display:block;width:88px;height:104px;line-height:104px;text-align:center;background:#FAF7F2;border:1px solid #E8E2D9;border-radius:4px;color:#685E56;font-family:Georgia,serif;font-size:24px;">L</span>`;
    return `<tr>
      <td class="product-image" width="104" style="width:104px;padding:18px 18px 18px 0;border-bottom:1px solid #E8E2D9;vertical-align:middle;">${image}</td>
      <td style="padding:18px 0;border-bottom:1px solid #E8E2D9;vertical-align:middle;">
        <div class="product-name" style="font-family:Georgia,serif;font-size:16px;color:#2B2420;font-weight:500;">${escapeHtml(item.name)}</div>
        ${item.variant ? `<div class="variant" style="margin-top:4px;font-size:12px;color:#685E56;">${escapeHtml(item.variant)}</div>` : ""}
        <div style="margin-top:6px;font-size:12px;color:#968A80;">Quantity: ${item.quantity}</div>
      </td>
      <td class="product-price" style="padding:18px 0 18px 16px;border-bottom:1px solid #E8E2D9;vertical-align:middle;text-align:right;white-space:nowrap;font-size:14px;color:#2B2420;font-weight:500;">${formatMoney(item.unit_price * item.quantity, currency)}</td>
    </tr>`;
  }).join("");
  return `<table role="presentation" class="product-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${rows}</table>`;
}

function editorialOrderTotals(totals: OrderTotals): string {
  const discount = totals.discount && totals.discount > 0
    ? `<tr><td style="padding:6px 0;color:#685E56;font-size:13px;">Discount</td><td style="padding:6px 0;text-align:right;color:#685E56;font-size:13px;white-space:nowrap;">&minus;${formatMoney(totals.discount, totals.currency)}</td></tr>`
    : "";
  const giftCard = totals.gift_card && totals.gift_card > 0
    ? `<tr><td style="padding:6px 0;color:#685E56;font-size:13px;">Gift card</td><td style="padding:6px 0;text-align:right;color:#685E56;font-size:13px;white-space:nowrap;">&minus;${formatMoney(totals.gift_card, totals.currency)}</td></tr>`
    : "";
  return `<table role="presentation" class="total-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:16px 0 28px;">
    <tr><td style="padding:6px 0;color:#685E56;font-size:13px;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#2B2420;font-size:13px;white-space:nowrap;">${formatMoney(totals.subtotal, totals.currency)}</td></tr>
    ${discount}
    ${giftCard}
    <tr><td style="padding:6px 0;color:#685E56;font-size:13px;">Shipping</td><td style="padding:6px 0;text-align:right;color:#2B2420;font-size:13px;white-space:nowrap;">${formatMoney(totals.shipping, totals.currency)}</td></tr>
    <tr><td style="padding:6px 0;color:#685E56;font-size:13px;">${totals.taxIncluded ? "Tax (included)" : "Tax"}</td><td style="padding:6px 0;text-align:right;color:#2B2420;font-size:13px;white-space:nowrap;">${formatMoney(totals.tax, totals.currency)}</td></tr>
    <tr class="grand-total"><td style="padding:14px 0 0;border-top:1px solid #2B2420;color:#2B2420;font-size:16px;font-weight:600;font-family:Georgia,serif;">Total</td><td style="padding:14px 0 0;border-top:1px solid #2B2420;text-align:right;color:#2B2420;font-size:16px;font-weight:600;white-space:nowrap;font-family:Georgia,serif;">${formatMoney(totals.total, totals.currency)}</td></tr>
  </table>`;
}

export function orderConfirmationEmail(props: OrderConfirmationProps) {
  const firstName = props.customerName?.trim().split(/\s+/)[0];
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const date = props.orderDate ? new Date(props.orderDate) : new Date();
  const placedOn = Number.isNaN(date.getTime())
    ? "Confirmed today"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const billing = props.billingAddress ?? props.shippingAddress;
  const viewOrderUrl = props.trackingUrl
    ?? `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;

  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      Thank you for choosing <strong>LETTY</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We are delighted to confirm that your order has been successfully placed and is now being prepared. As soon as it is on its way, we will send an update with your tracking information, so you can follow every step of the delivery.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 24px;">
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 0 0 32px;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>

    ${maisonOrderInfoGrid({
      orderNumber: props.orderNumber,
      orderPlaced: placedOn,
      deliveryMethod: props.deliveryMethod || "Standard delivery",
      shippingAddressHtml: editorialAddress(props.shippingAddress),
      billingAddressHtml: editorialAddress(billing),
    })}

    <div style="margin: 32px 0 20px;">
      <h3 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 19px; font-weight: 400; color: ${MAISON_COLORS.ink};">Your pieces</h3>
      ${editorialOrderItems(props.items, props.totals.currency, props.siteUrl)}
      ${editorialOrderTotals(props.totals)}
      ${maisonLineButton("VIEW YOUR ORDER", viewOrderUrl)}
    </div>
  `;

  const text = [
    `Dear ${firstName || "Valued Client"},`,
    "Thank you for choosing LETTY.",
    `Your order ${props.orderNumber} is confirmed and is now being prepared.`,
    `Order placed: ${placedOn}`,
    `Delivery method: ${props.deliveryMethod || "Standard delivery"}`,
    `Payment method: ${props.paymentMethod || "Secure online payment"}`,
    "",
    "ITEMS",
    ...props.items.map(
      (i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} — ${formatMoney(i.unit_price, props.totals.currency)}`,
    ),
    "",
    `Total: ${formatMoney(props.totals.total, props.totals.currency)}`,
    `View your order: ${viewOrderUrl}`,
    "",
    "Warm regards,",
    "LETTY",
  ]
    .filter(Boolean)
    .join("\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: `Order ${props.orderNumber} confirmed`,
    preheader: `Order ${props.orderNumber} is confirmed and is now being prepared.`,
    siteUrl: props.siteUrl,
    webviewUrl: viewOrderUrl,
  });
}

/* ---------- 2.C — orderShipped --------------------------------------- */

export interface OrderShippedProps {
  customerName?: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDays?: string;
  items?: OrderItem[];
  currency?: Currency;
  siteUrl: string;
}

export function orderShippedEmail(props: OrderShippedProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const trackUrl = props.trackingUrl
    || `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;

  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We are pleased to inform you that your order number <strong>${escapeHtml(props.orderNumber)}</strong> has been dispatched via <strong>${escapeHtml(props.carrier)}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      Tracking number: <strong style="color:${MAISON_COLORS.ink};">${escapeHtml(props.trackingNumber)}</strong>
      ${props.estimatedDays ? `<br>Estimated arrival: <strong>${escapeHtml(props.estimatedDays)}</strong>` : ""}
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 26px;">
      To follow your package journey, please access carrier delivery tracking by clicking below:
    </p>
    ${maisonLineButton("TRACK MY ORDER", trackUrl)}
    ${props.items && props.items.length > 0 ? `
    <div style="margin: 32px 0 20px;">
      <h3 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 19px; font-weight: 400; color: ${MAISON_COLORS.ink};">Dispatched pieces</h3>
      ${editorialOrderItems(props.items, props.currency || "USD", props.siteUrl)}
    </div>
    ` : ""}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-top: 30px; margin-bottom: 20px;">
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a> or in our boutiques.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;

  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `We are pleased to inform you that order ${props.orderNumber} has been dispatched via ${props.carrier}.`,
    `Tracking number: ${props.trackingNumber}`,
    props.estimatedDays ? `Estimated arrival: ${props.estimatedDays}` : "",
    `Track your shipment: ${trackUrl}`,
    "",
    "We thank you for your order and hope to see you again soon.",
    "Warm regards,",
    "LETTY",
  ]
    .filter(Boolean)
    .join("\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: `Your order is on its way — ${props.orderNumber}`,
    preheader: `Order ${props.orderNumber} dispatched via ${props.carrier}.`,
    siteUrl: props.siteUrl,
    webviewUrl: trackUrl,
  });
}

/* ---------- 2.C.1 — orderReadyForPickup (PDF 1 Replication) ----------- */

export interface OrderReadyForPickupProps {
  customerName?: string;
  orderNumber: string;
  trackingUrl?: string;
  pickupLocationName?: string;
  siteUrl: string;
}

export function orderReadyForPickupEmail(props: OrderReadyForPickupProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const trackUrl = props.trackingUrl
    || `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;

  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We are pleased to inform you that your order number <strong>${escapeHtml(props.orderNumber)}</strong> was delivered to a pickup collection point.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We invite you to bring your ID to collect your order.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 26px;">
      For more information regarding the collection point address, please access the carrier delivery tracking by clicking below:
    </p>
    ${maisonLineButton("TRACK MY ORDER", trackUrl)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-top: 30px; margin-bottom: 20px;">
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a> or in our boutiques.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;

  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `We are pleased to inform you that your order number ${props.orderNumber} was delivered to a pickup collection point.`,
    "We invite you to bring your ID to collect your order.",
    `Carrier delivery tracking: ${trackUrl}`,
    "",
    "We thank you for your order and hope to see you again soon on our website or in our boutiques.",
    "Warm regards,",
    "LETTY",
  ].join("\n\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: "Your order is ready for pickup",
    preheader: `Your order ${props.orderNumber} was delivered to a pickup collection point. Bring your ID.`,
    siteUrl: props.siteUrl,
    webviewUrl: trackUrl,
  });
}

/* ---------- 2.D — orderDelivered (PDF 2 Replication) ----------------- */

export interface OrderDeliveredProps {
  customerName?: string;
  orderNumber: string;
  orderPlacedDate?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  items?: OrderItem[];
  currency?: Currency;
  siteUrl: string;
}

export function orderDeliveredEmail(props: OrderDeliveredProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const date = props.deliveryDate ? new Date(props.deliveryDate) : new Date();
  const deliveryFormatted = Number.isNaN(date.getTime())
    ? (props.deliveryDate || "today")
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  const placedDate = props.orderPlacedDate ? new Date(props.orderPlacedDate) : null;
  const placedFormatted = placedDate && !Number.isNaN(placedDate.getTime())
    ? `${placedDate.getMonth() + 1}/${placedDate.getDate()}/${placedDate.getFullYear()}`
    : (props.orderPlacedDate || undefined);

  const billing = props.billingAddress ?? props.shippingAddress;
  const trackUrl = `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;

  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We are pleased to inform you that your order number <strong>${escapeHtml(props.orderNumber)}</strong> was delivered on ${deliveryFormatted}.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 24px;">
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 0 0 34px;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>

    ${maisonOrderInfoGrid({
      orderNumber: props.orderNumber,
      orderPlaced: placedFormatted,
      deliveryMethod: props.deliveryMethod || "ups",
      deliveryDate: deliveryFormatted,
      shippingAddressHtml: props.shippingAddress ? editorialAddress(props.shippingAddress) : undefined,
      billingAddressHtml: billing ? editorialAddress(billing) : undefined,
    })}

    ${props.items && props.items.length > 0 ? `
    <div style="margin: 32px 0 20px;">
      <h3 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 19px; font-weight: 400; color: ${MAISON_COLORS.ink};">Delivered pieces</h3>
      ${editorialOrderItems(props.items, props.currency || "USD", props.siteUrl)}
    </div>
    ` : ""}
  `;

  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `We are pleased to inform you that your order number ${props.orderNumber} was delivered on ${deliveryFormatted}.`,
    "",
    "Order Information:",
    `Order number: ${props.orderNumber}`,
    placedFormatted ? `Order placed: ${placedFormatted}` : "",
    `Delivery method: ${props.deliveryMethod || "ups"}`,
    `Delivery date: ${deliveryFormatted}`,
    "",
    "We thank you for your order and hope to see you again soon on our website or in our boutiques.",
    "Warm regards,",
    "LETTY",
  ]
    .filter(Boolean)
    .join("\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: "Your order was delivered",
    preheader: `Your order ${props.orderNumber} was delivered on ${deliveryFormatted}.`,
    siteUrl: props.siteUrl,
    webviewUrl: trackUrl,
  });
}

/* ---------- 2.D.1 — customerSatisfactionSurvey (PDF 3 Replication) ---- */

export interface CustomerSatisfactionSurveyProps {
  customerName?: string;
  orderNumber?: string;
  siteUrl: string;
}

export function customerSatisfactionSurveyEmail(props: CustomerSatisfactionSurveyProps) {
  const salutation = props.customerName?.trim()
    ? `Dear ${escapeHtml(props.customerName.trim())},`
    : "Dear Madam, Dear Sir,";

  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">${salutation}</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      LETTY thanks you for contacting our Customer Service.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 28px;">
      As your satisfaction is our priority, we would be grateful if you could spare a few minutes to help with the continuous improvement of our quality of service. Your feedback matters to us and will help support and finetune the experience that we offer you.
    </p>
    ${maisonRatingScale({
      question: "Would you recommend LETTY to your friends and family?",
      siteUrl: props.siteUrl,
      orderNumber: props.orderNumber,
    })}
  `;

  const text = [
    salutation,
    "LETTY thanks you for contacting our Customer Service.",
    "As your satisfaction is our priority, we would be grateful if you could spare a few minutes to help with the continuous improvement of our quality of service. Your feedback matters to us and will help support and finetune the experience that we offer you.",
    "",
    "Would you recommend LETTY to your friends and family?",
    "0 - Not at all   |   10 - Absolutely",
    `${props.siteUrl.replace(/\/$/, "")}`,
    "(Open this email in your browser to use the rating buttons.)",
    "",
    "Warm regards,",
    "LETTY",
  ].join("\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: "LETTY Customer Service",
    preheader: "Your feedback matters to us and helps continuous improvement.",
    siteUrl: props.siteUrl,
    unsubscribeUrl: `${props.siteUrl.replace(/\/$/, "")}/account/notifications`,
  });
}


/* ---------- 2.E — paymentFailed -------------------------------------- */

export interface PaymentFailedProps {
  customerName?: string;
  orderNumber: string;
  reason?: string;
  /** Where to resume — the shopper's bag persists in their browser. */
  resumeUrl: string;
  siteUrl: string;
}

export function paymentFailedEmail(props: PaymentFailedProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We could not finalise payment for order <strong>${escapeHtml(props.orderNumber)}</strong>. Nothing has been charged.
    </p>
    ${props.reason ? `<p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-bottom: 18px;">Reason: <em>${escapeHtml(props.reason)}</em></p>` : ""}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 26px;">
      Your selection remains saved in your bag — return to checkout to secure your pieces.
    </p>
    ${maisonLineButton("RETURN TO YOUR BAG", props.resumeUrl)}
    <p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-top: 24px;">
      If the issue persists, write to <a href="mailto:concierge@houseofletty.com" style="color:${MAISON_COLORS.ink};text-decoration:underline;">concierge@houseofletty.com</a> and we will assist personally.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;

  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `We could not finalise payment for order ${props.orderNumber}. Nothing has been charged.`,
    props.reason ? `Reason: ${props.reason}` : "",
    `Resume checkout: ${props.resumeUrl}`,
    "",
    "Need help? concierge@houseofletty.com",
    "Warm regards,",
    "LETTY",
  ].filter(Boolean).join("\n\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: `Payment for order ${props.orderNumber} did not complete`,
    preheader: "Nothing was charged — your bag is saved.",
    siteUrl: props.siteUrl,
    webviewUrl: props.resumeUrl,
  });
}

/* ---------- 2.F — refundIssued --------------------------------------- */

export interface RefundIssuedProps {
  customerName?: string;
  orderNumber: string;
  amount: number;
  currency: Currency;
  restock: boolean;
  siteUrl: string;
}

export function refundIssuedEmail(props: RefundIssuedProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const trackUrl = `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      A refund of <strong>${formatMoney(props.amount, props.currency)}</strong> has been issued for order <strong>${escapeHtml(props.orderNumber)}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      Funds typically settle within 5–10 business days, depending on your financial institution.
    </p>
    ${props.restock ? `<p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-bottom: 24px;">Your pieces have been returned to our atelier inventory.</p>` : ""}
    ${maisonLineButton("VIEW ORDER", trackUrl)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;

  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `A refund of ${formatMoney(props.amount, props.currency)} has been issued for order ${props.orderNumber}.`,
    "Funds typically settle within 5-10 business days.",
    `View order: ${trackUrl}`,
    "",
    "Warm regards,",
    "LETTY",
  ].join("\n\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: `Refund issued for order ${props.orderNumber}`,
    preheader: `${formatMoney(props.amount, props.currency)} refund on the way.`,
    siteUrl: props.siteUrl,
    webviewUrl: trackUrl,
  });
}

/* ---------- 2.G — reviewRequest (batched) ---------------------------- */

export interface ReviewRequestProps {
  customerName?: string;
  items: Array<{ name: string; slug: string; image_url?: string | null }>;
  siteUrl: string;
}

export function reviewRequestEmail(props: ReviewRequestProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const shown = props.items.slice(0, 3);
  const extra = Math.max(0, props.items.length - shown.length);
  const cards = shown
    .map(
      (it) => {
        const src = formatEmailImageUrl(it.image_url, props.siteUrl);
        return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${MAISON_COLORS.line};">
          ${
            src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.name)}" width="64" height="64" style="display:inline-block;vertical-align:middle;margin-right:14px;border:1px solid ${MAISON_COLORS.line};border-radius:4px;object-fit:cover;background:${MAISON_COLORS.canvas};">`
              : `<span style="display:inline-block;vertical-align:middle;margin-right:14px;width:64px;height:64px;line-height:64px;text-align:center;border:1px solid ${MAISON_COLORS.line};border-radius:4px;background:${MAISON_COLORS.canvas};color:${MAISON_COLORS.stone};font-family:Georgia,serif;font-size:20px;">L</span>`
          }
          <span style="vertical-align:middle;display:inline-block;">
            <strong style="color:${MAISON_COLORS.ink};font-size:14px;">${escapeHtml(it.name)}</strong><br>
            <a href="${escapeHtml(`${props.siteUrl}/products/${it.slug}#reviews`)}" style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MAISON_COLORS.ink};">Write a review</a>
          </span>
        </td>
      </tr>`;
      },
    )
    .join("");
  const moreLine = extra > 0
    ? `<p style="font-size:13px;line-height:1.6;color:${MAISON_COLORS.muted};margin-top:12px;">…and ${extra} more. View all your orders to leave a review.</p>`
    : "";
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      A week has passed since your order arrived. A few words on the pieces you chose would mean a great deal — to us, and to future clients considering them.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 4px;">${cards}</table>
    ${moreLine}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;
  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    "A week has passed since your order arrived. We would be grateful for a review.",
    "",
    ...shown.map((it) => `- ${it.name} — ${props.siteUrl}/products/${it.slug}#reviews`),
    extra > 0 ? `...and ${extra} more.` : "",
    "",
    "Warm regards,",
    "LETTY",
  ]
    .filter(Boolean)
    .join("\n");
  return renderMaisonEmailLayout({
    body,
    text,
    subject: props.customerName
      ? `${props.customerName.split(/\s+/)[0]}, how are your LETTY pieces?`
      : `How are your LETTY pieces?`,
    preheader: "A short review would help us shape the next collection.",
    siteUrl: props.siteUrl,
    webviewUrl: `${props.siteUrl.replace(/\/$/, "")}/account/orders`,
  });
}

/* ---------- 2.H — abandonedCart -------------------------------------- */

export function abandonedCartEmail(props: {
  customerName?: string;
  cartUrl: string;
  itemCount: number;
  currency: Currency;
  total: number;
  /** Item cards (thumbnail + name) — recovery converts far better when the
   *  shopper sees exactly what is waiting. */
  items?: Array<{ name: string; quantity: number; image_url?: string | null }>;
}) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const first = props.customerName?.trim().split(/\s+/)[0];
  const shown = (props.items ?? []).slice(0, 3);
  const extra = Math.max(0, (props.items?.length ?? 0) - shown.length);
  const cards = shown
    .map(
      (it) => {
        const src = formatEmailImageUrl(it.image_url, props.cartUrl);
        return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${MAISON_COLORS.line};">
          ${
            src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.name)}" width="64" height="64" style="display:inline-block;vertical-align:middle;margin-right:14px;border:1px solid ${MAISON_COLORS.line};border-radius:4px;object-fit:cover;background:${MAISON_COLORS.canvas};">`
              : `<span style="display:inline-block;vertical-align:middle;margin-right:14px;width:64px;height:64px;line-height:64px;text-align:center;border:1px solid ${MAISON_COLORS.line};border-radius:4px;background:${MAISON_COLORS.canvas};color:${MAISON_COLORS.stone};font-family:Georgia,serif;font-size:20px;">L</span>`
          }
          <span style="vertical-align:middle;display:inline-block;">
            <strong style="color:${MAISON_COLORS.ink};font-size:14px;">${escapeHtml(it.name)}</strong><br>
            <span style="font-size:12px;color:${MAISON_COLORS.muted};">Qty ${it.quantity}</span>
          </span>
        </td>
      </tr>`;
      },
    )
    .join("");
  const moreLine = extra > 0
    ? `<p style="font-size:13px;line-height:1.6;color:${MAISON_COLORS.muted};margin-top:12px;">…and ${extra} more in your bag.</p>`
    : "";
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      You left ${props.itemCount} item${props.itemCount === 1 ? "" : "s"} in your bag — <strong style="color:${MAISON_COLORS.ink};">${formatMoney(props.total, props.currency)}</strong> total.
    </p>
    ${shown.length > 0 ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 4px;">${cards}</table>` : ""}
    ${moreLine}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 18px 0 26px;">
      Pieces are held briefly. When you are ready, your bag is one tap away.
    </p>
    ${maisonLineButton("RETURN TO YOUR BAG", props.cartUrl)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;
  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    `${props.itemCount} item(s) — ${formatMoney(props.total, props.currency)} — are waiting in your bag.`,
    ...shown.map((it) => `- ${it.name} x${it.quantity}`),
    extra > 0 ? `...and ${extra} more.` : "",
    `Resume: ${props.cartUrl}`,
    "",
    "Warm regards,",
    "LETTY",
  ]
    .filter(Boolean)
    .join("\n");
  return renderMaisonEmailLayout({
    body,
    text,
    subject: first ? `${first}, your bag is waiting` : "Your bag is waiting — LETTY",
    preheader: `${props.itemCount} pieces held in your bag.`,
    siteUrl: props.cartUrl,
    webviewUrl: props.cartUrl,
  });
}

/* ---------- passwordReset -------------------------------------------- */

export interface PasswordResetProps {
  customerName?: string;
  resetUrl: string;
  siteUrl: string;
}

export function passwordResetEmail(props: PasswordResetProps) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We received a request to reset the password for your LETTY account.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 26px;">
      For your security, this link is valid for <strong style="color:${MAISON_COLORS.ink};">30 minutes</strong> and can be used only once. If you did not request a reset, you can safely ignore this email — your password will not change.
    </p>
    ${maisonLineButton("RESET MY PASSWORD", props.resetUrl)}
    <p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-top: 24px; word-break: break-all;">
      If the button does not work, copy this link into your browser:<br>
      <a href="${escapeHtml(props.resetUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">${escapeHtml(props.resetUrl)}</a>
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-top: 18px;">
      Need help? Write to <a href="mailto:concierge@houseofletty.com" style="color:${MAISON_COLORS.ink};text-decoration:underline;">concierge@houseofletty.com</a>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;

  const text = [
    `Dear ${props.customerName?.trim() || "Valued Client"},`,
    "We received a request to reset the password for your LETTY account.",
    "For your security, this link is valid for 30 minutes and can be used only once.",
    "If you did not request a reset, you can safely ignore this email — your password will not change.",
    "",
    `Reset your password: ${props.resetUrl}`,
    "",
    "Need help? concierge@houseofletty.com",
    "Warm regards,",
    "LETTY",
  ].join("\n");

  return renderMaisonEmailLayout({
    body,
    text,
    subject: "Reset your LETTY password",
    preheader: "This secure link expires in 30 minutes and works only once.",
    siteUrl: props.siteUrl,
    webviewUrl: props.resetUrl,
  });
}

/* ---------- 2.I — welcome -------------------------------------------- */

export function welcomeEmail(props: { customerName?: string; siteUrl: string }) {
  const addressee = escapeHtml(props.customerName?.trim() || "Valued Client");
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Dear ${addressee},</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      We are delighted to have you. Explore our latest collections, signature ribbon packaging on every order, and complimentary samples with selected orders.
    </p>
    ${maisonLineButton("BEGIN SHOPPING", props.siteUrl)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;
  const text = [
    `Dear ${props.customerName || "Valued Client"},`,
    "Welcome to LETTY — luxury beauty, fragrance, fashion, and eyewear. Signature packaging and two deluxe samples with every order.",
    "",
    `Begin shopping: ${props.siteUrl}`,
    "",
    "Warm regards,",
    "LETTY",
  ].join("\n");
  return renderMaisonEmailLayout({
    body,
    text,
    subject: "Welcome to LETTY",
    preheader: "Signature packaging and two deluxe samples with every order.",
    siteUrl: props.siteUrl,
    webviewUrl: `${props.siteUrl.replace(/\/$/, "")}/collections`,
  });
}

/**
 * Newsletter-specific welcome. Distinct from the customer welcome: a
 * subscriber has not bought anything, so purchase-gated promises
 * ("two deluxe samples with your purchase") do not apply.
 */
export function newsletterWelcomeEmail(props: { siteUrl: string; unsubscribeUrl?: string }) {
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">Welcome to the inner circle.</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      You are on the list — private invitations, early access to new collections, and the occasional note from the atelier will find you here first.
    </p>
    ${maisonLineButton("EXPLORE LETTY", props.siteUrl)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">LETTY</strong>
    </p>
  `;
  const text = [
    "Welcome to the inner circle.",
    "Private invitations, early access, and notes from the atelier — you will see them first.",
    "",
    props.siteUrl,
    "",
    "Warm regards,",
    "LETTY",
  ].join("\n");
  return renderMaisonEmailLayout({
    body,
    text,
    subject: "You're on the list — LETTY",
    preheader: "Private invitations and early access, first to you.",
    siteUrl: props.siteUrl,
    webviewUrl: `${props.siteUrl.replace(/\/$/, "")}/collections`,
    unsubscribeUrl: props.unsubscribeUrl,
  });
}

/* ---------- 2.J — newOrderAlert (admin only) ------------------------- */

export function newOrderAlertEmail(props: {
  orderNumber: string;
  total: number;
  currency: Currency;
  customerEmail: string;
  gateway: "stripe";
  adminUrl: string;
}) {
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">New paid order.</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      <strong style="color:${MAISON_COLORS.ink};">${escapeHtml(props.orderNumber)}</strong> from <strong style="color:${MAISON_COLORS.ink};">${escapeHtml(props.customerEmail)}</strong>
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.muted}; margin-bottom: 26px;">
      Total: <strong style="color:${MAISON_COLORS.ink};">${formatMoney(props.total, props.currency)}</strong> &middot; Gateway: ${props.gateway}
    </p>
    ${maisonLineButton("OPEN IN ADMIN", props.adminUrl)}
  `;
  const text = `New order ${props.orderNumber} from ${props.customerEmail} — ${formatMoney(props.total, props.currency)} via ${props.gateway}. Open: ${props.adminUrl}`;
  return renderMaisonEmailLayout({
    body,
    text,
    subject: `[LETTY] New order ${props.orderNumber} — ${formatMoney(props.total, props.currency)}`,
    preheader: `${formatMoney(props.total, props.currency)} paid order from ${props.customerEmail}.`,
    siteUrl: props.adminUrl,
    webviewUrl: props.adminUrl,
    showNav: false,
    showBanner: false,
    showCustomerCare: false,
    showPerks: false,
    showFooter: false,
  });
}

/* ---------- contactAutoReply (item 1.13) ----------------------------- */

export function contactAutoReplyEmail(props: {
  customerName?: string;
  siteUrl: string;
}) {
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">${escapeHtml(greet)}</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      Thank you for writing. A member of our concierge team will reply within one business day, often sooner.
    </p>
    ${maisonLineButton("VISIT THE EDIT", `${props.siteUrl.replace(/\/$/, "")}/collections`)}
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin: 24px 0 0;">
      Warm regards,<br>
      <strong style="color:${MAISON_COLORS.ink};font-weight:600;">The LETTY concierge</strong>
    </p>
  `;
  const text = `Thank you for writing. A concierge will reply within one business day. ${props.siteUrl}/collections`;
  return renderMaisonEmailLayout({
    body,
    text,
    subject: "We received your note — LETTY",
    preheader: "Our concierge will reply within one business day.",
    siteUrl: props.siteUrl,
    webviewUrl: `${props.siteUrl.replace(/\/$/, "")}/collections`,
  });
}

export function contactConciergePingEmail(props: {
  customerName?: string;
  customerEmail: string;
  message: string;
  adminUrl: string;
}) {
  const body = `
    <p style="font-family: Georgia, serif; font-size: 17px; color: ${MAISON_COLORS.ink}; margin-bottom: 22px;">New contact submission</p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; margin-bottom: 18px;">
      <strong style="color:${MAISON_COLORS.ink};">${escapeHtml(props.customerName || "Anonymous")}</strong> &lt;${escapeHtml(props.customerEmail)}&gt;
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: ${MAISON_COLORS.stone}; font-style: italic; margin-bottom: 26px;">
      ${escapeHtml(props.message)}
    </p>
    ${maisonLineButton("OPEN IN ADMIN", props.adminUrl)}
  `;
  const text = `New contact: ${props.customerName || "Anonymous"} <${props.customerEmail}>\n\n${props.message}\n\nOpen: ${props.adminUrl}`;
  return renderMaisonEmailLayout({
    body,
    text,
    subject: `[LETTY] New contact from ${props.customerName || props.customerEmail}`,
    preheader: `New message from ${props.customerEmail}`,
    siteUrl: props.adminUrl,
    webviewUrl: props.adminUrl,
    showNav: false,
    showBanner: false,
    showCustomerCare: false,
    showPerks: false,
    showFooter: false,
  });
}
