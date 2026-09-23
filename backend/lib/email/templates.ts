/**
 * Email templates — Letty luxury aesthetic.
 *
 * Every template returns its own `body` HTML (no <html>/<head>/<body>),
 * then defers to `renderLayout()` (in ./layout.ts) for the shared shell
 * (logo, wordmark, footer, fonts). This guarantees the brand emblem is
 * present in every email and the typography stays consistent.
 *
 * Adding a new template:
 *   1. Build the `body` string using the helpers below (`h1`, `h2`, `p`,
 *      `orderItemsTable`, `lineButton`, `addressBlock`).
 *   2. Call `renderLayout({ body, text, subject, preheader })`.
 *   3. Export a function that takes typed props and returns the layout
 *      result, so callers (post-payment job, abandoned-cart job, admin
 *      actions) get a fully-rendered email.
 */
import { formatMoney, type Currency } from "@/lib/utils/currency";
import { BRAND, MAISON_COLORS, formatEmailImageUrl } from "./brand";
import {
  renderLayout,
  renderMaisonEmailLayout,
  maisonLineButton,
  maisonRatingScale,
  maisonOrderInfoGrid,
  escapeHtml,
} from "./layout";

/* ---------------------------------------------------------------------- */
/*  Tiny HTML builders                                                    */
/* ---------------------------------------------------------------------- */

export function h1(text: string): string {
  return `<h1>${escapeHtml(text)}</h1>`;
}
export function h2(text: string): string {
  return `<h2>${escapeHtml(text)}</h2>`;
}
export function h3(text: string): string {
  return `<h3>${escapeHtml(text)}</h3>`;
}
export function p(text: string, opts: { lead?: boolean; muted?: boolean } = {}): string {
  const cls = opts.lead ? " lead" : opts.muted ? " muted" : "";
  return `<p${cls ? ` class="${cls.trim()}"` : ""}>${text}</p>`;
}
export function raw(html: string): string {
  return html;
}
export function divider(): string {
  return `<div class="divider"></div>`;
}
export function addressBlock(addr: {
  street: string;
  city: string;
  state: string;
  country: string;
  postal?: string;
}): string {
  return `<p class="address">
    ${escapeHtml(addr.street)}<br>
    ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)}${addr.postal ? ` ${escapeHtml(addr.postal)}` : ""}<br>
    ${escapeHtml(addr.country)}
  </p>`;
}

export function lineButton(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" class="button line">${escapeHtml(label)}</a>`;
}
export function solidButton(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" class="button">${escapeHtml(label)}</a>`;
}

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

export function orderItemsTable(items: OrderItem[], currency: Currency, siteUrl?: string): string {
  const rows = items
    .map(
      (it) => {
        const src = formatEmailImageUrl(it.image_url, siteUrl);
        const thumb = src
          ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.name)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #ECECEC;">`
          : `<span style="display:block;width:72px;height:72px;line-height:72px;text-align:center;border-radius:8px;border:1px solid #ECECEC;background:#F8F6F2;color:#5C5C5C;font-family:Georgia,serif;font-size:22px;">L</span>`;
        return `<tr>
        <td style="width:88px;padding:14px 16px 14px 0;vertical-align:middle;">${thumb}</td>
        <td style="vertical-align:middle;">
          ${escapeHtml(it.name)}
          ${it.variant ? `<br><span class="muted" style="font-size:12px;">${escapeHtml(it.variant)}</span>` : ""}
        </td>
        <td class="num" width="56" style="width:56px;padding:14px 0 14px 16px;white-space:nowrap;vertical-align:middle;">${it.quantity}</td>
        <td class="num" width="104" style="width:104px;padding:14px 0 14px 16px;white-space:nowrap;vertical-align:middle;">${formatMoney(it.unit_price, currency)}</td>
      </tr>`;
      },
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <thead>
      <tr>
        <th style="border-bottom:0;padding-bottom:4px;width:88px;"></th>
        <th>Item</th>
        <th class="num" width="56" style="width:56px;padding:14px 0 14px 16px;white-space:nowrap;">Qty</th>
        <th class="num" width="104" style="width:104px;padding:14px 0 14px 16px;white-space:nowrap;">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export interface OrderTotals {
  currency: Currency;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  gift_card?: number;
  total: number;
}

export function orderTotalsTable(t: OrderTotals): string {
  const discountRow = t.discount && t.discount > 0
    ? `<tr><td>Discount</td><td class="num">&minus;${formatMoney(t.discount, t.currency)}</td></tr>`
    : "";
  const giftRow = t.gift_card && t.gift_card > 0
    ? `<tr><td>Gift card</td><td class="num">&minus;${formatMoney(t.gift_card, t.currency)}</td></tr>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tbody>
      <tr><td>Subtotal</td><td class="num">${formatMoney(t.subtotal, t.currency)}</td></tr>
      ${discountRow}
      ${giftRow}
      <tr><td>Shipping</td><td class="num">${formatMoney(t.shipping, t.currency)}</td></tr>
      <tr><td>Tax</td><td class="num">${formatMoney(t.tax, t.currency)}</td></tr>
      <tr class="total"><td>Total</td><td class="num">${formatMoney(t.total, t.currency)}</td></tr>
    </tbody>
  </table>`;
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
    <tr><td style="padding:6px 0;color:#685E56;font-size:13px;">Tax</td><td style="padding:6px 0;text-align:right;color:#2B2420;font-size:13px;white-space:nowrap;">${formatMoney(totals.tax, totals.currency)}</td></tr>
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
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a> or in our boutiques.
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
      We thank you for your order and hope to see you again soon on <a href="${escapeHtml(props.siteUrl)}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">our website</a> or in our boutiques.
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
    `${props.siteUrl.replace(/\/$/, "")}/feedback${props.orderNumber ? `?order=${encodeURIComponent(props.orderNumber)}` : ""}`,
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
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const shown = props.items.slice(0, 3);
  const extra = Math.max(0, props.items.length - shown.length);
  const cards = shown
    .map(
      (it) => {
        const src = formatEmailImageUrl(it.image_url, props.siteUrl);
        return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};">
          ${
            src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.name)}" width="64" height="64" style="display:inline-block;vertical-align:middle;margin-right:14px;border:1px solid ${BRAND.line};border-radius:6px;object-fit:cover;">`
              : `<span style="display:inline-block;vertical-align:middle;margin-right:14px;width:64px;height:64px;line-height:64px;text-align:center;border:1px solid ${BRAND.line};border-radius:6px;background:${BRAND.bg};color:${BRAND.stone};font-family:Georgia,serif;font-size:20px;">L</span>`
          }
          <span style="vertical-align:middle;display:inline-block;">
            <strong style="color:${BRAND.ink};">${escapeHtml(it.name)}</strong><br>
            <a href="${escapeHtml(`${props.siteUrl}/products/${it.slug}#reviews`)}" style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.ink};">Write a review</a>
          </span>
        </td>
      </tr>`;
      },
    )
    .join("");
  const moreLine = extra > 0
    ? `<p class="muted" style="font-size:12px;">…and ${extra} more. View all your orders to leave a review.</p>`
    : "";
  const body = [
    h1("How is it living with you?"),
    p(
      `${greet} a week has passed since your order arrived. A few words on the pieces you chose would mean a great deal — to us, and to future clients considering them.`,
      { lead: true },
    ),
    raw(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${cards}</table>`),
    raw(moreLine),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "How is it living with you?",
    "A week has passed since your order arrived. We would be grateful for a review.",
    "",
    ...shown.map((it) => `- ${it.name} — ${props.siteUrl}/products/${it.slug}#reviews`),
    extra > 0 ? `...and ${extra} more.` : "",
    "",
    `With care, the ${"LETTY"} team.`,
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: props.customerName
      ? `${props.customerName.split(/\s+/)[0]}, how are your LETTY pieces?`
      : `How are your LETTY pieces?`,
    preheader: `A short review would help us shape the next collection.`,
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
  const first = props.customerName?.trim().split(/\s+/)[0];
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const shown = (props.items ?? []).slice(0, 3);
  const extra = Math.max(0, (props.items?.length ?? 0) - shown.length);
  const cards = shown
    .map(
      (it) => {
        const src = formatEmailImageUrl(it.image_url, props.cartUrl);
        return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};">
          ${
            src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.name)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid ${BRAND.line};">`
              : `<span style="display:block;width:64px;height:64px;line-height:64px;text-align:center;border-radius:8px;border:1px solid ${BRAND.line};background:${BRAND.bg};color:${BRAND.stone};font-family:Georgia,serif;font-size:20px;">L</span>`
          }
          <span style="display:inline-block;vertical-align:top;margin-left:14px;">
            <strong style="color:${BRAND.ink};">${escapeHtml(it.name)}</strong><br>
            <span class="muted" style="font-size:12px;">Qty ${it.quantity}</span>
          </span>
        </td>
      </tr>`;
      },
    )
    .join("");
  const moreLine = extra > 0
    ? `<p class="muted" style="font-size:12px;">…and ${extra} more in your bag.</p>`
    : "";
  const body = [
    h1("Your bag is waiting."),
    p(
      `${greet} you left ${props.itemCount} item${props.itemCount === 1 ? "" : "s"} in your bag — ${formatMoney(props.total, props.currency)} total.`,
      { lead: true },
    ),
    shown.length > 0 ? raw(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${cards}</table>`) : "",
    raw(moreLine),
    p("Pieces are held briefly. When you are ready, your bag is one tap away.", { muted: true }),
    lineButton("Return to bag", props.cartUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Your bag is waiting.",
    `${greet} ${props.itemCount} item(s) — ${formatMoney(props.total, props.currency)}.`,
    ...shown.map((it) => `- ${it.name} x${it.quantity}`),
    extra > 0 ? `...and ${extra} more.` : "",
    `Resume: ${props.cartUrl}`,
    "",
    `With care, the ${"LETTY"} team.`,
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: first ? `${first}, your bag is waiting` : "Your bag is waiting — LETTY",
    preheader: `${props.itemCount} pieces held in your bag.`,
  });
}

/* ---------- 2.I — welcome -------------------------------------------- */

export function welcomeEmail(props: { customerName?: string; siteUrl: string }) {
  const greet = props.customerName ? `Welcome, ${props.customerName}.` : "Welcome to LETTY.";
  const body = [
    h1(greet),
    p(
      "We are delighted to have you. Explore our latest collections, signature ribbon packaging on every order, and two deluxe samples with your purchase.",
      { lead: true },
    ),
    lineButton("Begin shopping", props.siteUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = `Welcome to LETTY — luxury beauty, fragrance, fashion, and eyewear. ${props.siteUrl}`;
  return renderLayout({
    body,
    text,
    subject: "Welcome to LETTY",
    preheader: "Signature packaging and two deluxe samples with every order.",
  });
}

/**
 * Newsletter-specific welcome. Distinct from the customer welcome: a
 * subscriber has not bought anything, so purchase-gated promises
 * ("two deluxe samples with your purchase") do not apply.
 */
export function newsletterWelcomeEmail(props: { siteUrl: string }) {
  const body = [
    h1("Welcome to the inner circle."),
    p(
      "You are on the list — private invitations, early access to new collections, and the occasional note from the atelier will find you here first.",
      { lead: true },
    ),
    p("Until the next letter, explore the maison.", { muted: true }),
    lineButton("Explore LETTY", props.siteUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Welcome to the inner circle.",
    "Private invitations, early access, and notes from the atelier — you will see them first.",
    "",
    props.siteUrl,
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: "You're on the list — LETTY",
    preheader: "Private invitations and early access, first to you.",
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
  const body = [
    h1("New paid order."),
    p(
      `<strong>${escapeHtml(props.orderNumber)}</strong> from <strong>${escapeHtml(props.customerEmail)}</strong>`,
      { lead: true },
    ),
    p(
      `Total: <strong>${formatMoney(props.total, props.currency)}</strong> &middot; Gateway: <strong>${props.gateway}</strong>`,
      { muted: true },
    ),
    solidButton("Open in admin", props.adminUrl),
  ].join("\n");
  const text = `New order ${props.orderNumber} from ${props.customerEmail} — ${formatMoney(props.total, props.currency)} via ${props.gateway}. Open: ${props.adminUrl}`;
  return renderLayout({
    body,
    text,
    subject: `[LETTY] New order ${props.orderNumber} — ${formatMoney(props.total, props.currency)}`,
    preheader: `${formatMoney(props.total, props.currency)} paid order from ${props.customerEmail}.`,
  });
}

/* ---------- contactAutoReply (item 1.13) ----------------------------- */

export function contactAutoReplyEmail(props: {
  customerName?: string;
  siteUrl: string;
}) {
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("We received your note."),
    p(
      `${greet} thank you for writing. A member of our concierge team will reply within one business day, often sooner.`,
      { lead: true },
    ),
    p("In the meantime, explore the latest edit.", { muted: true }),
    lineButton("Visit the edit", `${props.siteUrl}/collections`),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} concierge</span>.`, { muted: true }),
  ].join("\n");
  const text = `Thank you for writing. A concierge will reply within one business day. ${props.siteUrl}/collections`;
  return renderLayout({
    body,
    text,
    subject: "We received your note — LETTY",
    preheader: "Our concierge will reply within one business day.",
  });
}

export function contactConciergePingEmail(props: {
  customerName?: string;
  customerEmail: string;
  message: string;
  adminUrl: string;
}) {
  const body = [
    h1("New contact submission"),
    p(`<strong>${escapeHtml(props.customerName || "Anonymous")}</strong> &lt;${escapeHtml(props.customerEmail)}&gt;`, { lead: true }),
    p(`<em>${escapeHtml(props.message)}</em>`, {}),
    solidButton("Open in admin", props.adminUrl),
  ].join("\n");
  const text = `New contact: ${props.customerName || "Anonymous"} <${props.customerEmail}>\n\n${props.message}\n\nOpen: ${props.adminUrl}`;
  return renderLayout({
    body,
    text,
    subject: `[LETTY] New contact from ${props.customerName || props.customerEmail}`,
    preheader: `New message from ${props.customerEmail}`,
  });
}
