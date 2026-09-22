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
import { BRAND } from "./brand";
import { renderEditorialOrderLayout, renderLayout, escapeHtml } from "./layout";

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
  // Email clients cannot resolve site-relative paths, and some order
  // snapshots store local media paths — absolutize against the site URL.
  const absolutize = (u?: string | null): string | null => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/") && siteUrl) {
      return `${siteUrl.replace(/\/$/, "")}${encodeURI(u)}`;
    }
    return u;
  };

  const rows = items
    .map(
      (it) => {
        const src = absolutize(it.image_url);
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
  const absolutize = (url?: string | null): string | null => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return url.startsWith("/") ? `${siteUrl.replace(/\/$/, "")}${encodeURI(url)}` : url;
  };
  const rows = items.map((item) => {
    const src = absolutize(item.image_url);
    const image = src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.name)}" width="96" height="112" style="display:block;width:96px;height:112px;object-fit:cover;border:0;background:#efe3d6;">`
      : `<span style="display:block;width:96px;height:112px;line-height:112px;text-align:center;background:#efe3d6;color:#32150d;font-family:Georgia,serif;font-size:28px;">L</span>`;
    return `<tr>
      <td class="product-image" width="112" style="width:112px;padding:22px 22px 22px 0;border-bottom:1px solid #413630;vertical-align:middle;">${image}</td>
      <td style="padding:22px 0;border-bottom:1px solid #413630;vertical-align:middle;">
        <div class="product-name">${escapeHtml(item.name)}</div>
        ${item.variant ? `<div class="variant" style="margin-top:3px;">${escapeHtml(item.variant)}</div>` : ""}
        <div style="margin-top:8px;color:#cdbfb5;">Quantity: ${item.quantity}</div>
      </td>
      <td class="product-price" style="padding:22px 0 22px 18px;border-bottom:1px solid #413630;vertical-align:middle;text-align:right;white-space:nowrap;">${formatMoney(item.unit_price * item.quantity, currency)}</td>
    </tr>`;
  }).join("");
  return `<table role="presentation" class="product-table" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;
}

function editorialOrderTotals(totals: OrderTotals): string {
  const discount = totals.discount && totals.discount > 0
    ? `<tr><td>Discount</td><td>&minus;${formatMoney(totals.discount, totals.currency)}</td></tr>`
    : "";
  const giftCard = totals.gift_card && totals.gift_card > 0
    ? `<tr><td>Gift card</td><td>&minus;${formatMoney(totals.gift_card, totals.currency)}</td></tr>`
    : "";
  return `<table role="presentation" class="total-table" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td>Subtotal</td><td>${formatMoney(totals.subtotal, totals.currency)}</td></tr>
    ${discount}
    ${giftCard}
    <tr><td>Shipping</td><td>${formatMoney(totals.shipping, totals.currency)}</td></tr>
    <tr><td>Tax</td><td>${formatMoney(totals.tax, totals.currency)}</td></tr>
    <tr class="grand-total"><td>Total</td><td>${formatMoney(totals.total, totals.currency)}</td></tr>
  </table>`;
}

export function orderConfirmationEmail(props: OrderConfirmationProps) {
  const firstName = props.customerName?.trim().split(/\s+/)[0];
  const addressee = escapeHtml(firstName || "there");
  const date = props.orderDate ? new Date(props.orderDate) : new Date();
  const placedOn = Number.isNaN(date.getTime())
    ? "Confirmed today"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const billing = props.billingAddress ?? props.shippingAddress;
  const viewOrderUrl = props.trackingUrl
    ?? `${props.siteUrl.replace(/\/$/, "")}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;
  const body = `
    <div class="editorial-copy">
      <h1>Dear ${addressee},</h1>
      <p>Thank you for choosing <span class="wordmark">LETTY</span>.</p>
      <p>We are delighted to confirm that your order has been successfully placed and is now being prepared. As soon as it is on its way, we will send an update with your tracking information, so you can follow every step of the delivery.</p>
      <p>Thank you for your order. We hope to welcome you again soon at <a href="${escapeHtml(props.siteUrl)}">houseofletty.com</a>.</p>
      <p class="signature">Warm regards,<br><span class="wordmark">LETTY</span></p>
    </div>

    <div class="section-title">Order information</div>
    <div class="section-content">
      <table role="presentation" class="info-grid" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td>
            <strong>Order information</strong>
            <span class="label">Order number:</span> ${escapeHtml(props.orderNumber)}<br>
            <span class="label">Order placed:</span> ${escapeHtml(placedOn)}<br>
            <span class="label">Delivery method:</span> ${escapeHtml(props.deliveryMethod || "Standard delivery")}
          </td>
          <td>
            <strong>Payment method</strong>
            ${escapeHtml(props.paymentMethod || "Secure online payment")}
          </td>
        </tr>
        <tr>
          <td>
            <strong>Shipping address</strong>
            ${editorialAddress(props.shippingAddress)}
          </td>
          <td>
            <strong>Billing address</strong>
            ${editorialAddress(billing)}
          </td>
        </tr>
      </table>
    </div>

    <div class="section-title">Your pieces</div>
    <div class="section-content">
      ${editorialOrderItems(props.items, props.totals.currency, props.siteUrl)}
      ${editorialOrderTotals(props.totals)}
      <a href="${escapeHtml(viewOrderUrl)}" class="order-button">View your order</a>
    </div>`;
  const text = [
    `Dear ${firstName || "there"},`,
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
  return renderEditorialOrderLayout({
    body,
    text,
    subject: `Order ${props.orderNumber} confirmed`,
    preheader: `Order ${props.orderNumber} is confirmed and is now being prepared.`,
    bannerUrl: `${props.siteUrl.replace(/\/$/, "")}/email/order-confirmation-banner.jpg`,
    siteUrl: props.siteUrl,
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
  siteUrl: string;
}

export function orderShippedEmail(props: OrderShippedProps) {
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Your order is on its way."),
    p(
      `${greet} order <strong>${escapeHtml(props.orderNumber)}</strong> has been dispatched via <strong>${escapeHtml(props.carrier)}</strong>.`,
      { lead: true },
    ),
    p(`Tracking number: <strong>${escapeHtml(props.trackingNumber)}</strong>`, {}),
    props.estimatedDays ? p(`Estimated arrival: <strong>${escapeHtml(props.estimatedDays)}</strong>`, { muted: true }) : "",
    lineButton("Track shipment", props.trackingUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Your order is on its way.",
    `Order ${props.orderNumber} shipped via ${props.carrier}.`,
    `Tracking: ${props.trackingNumber} — ${props.trackingUrl}`,
    props.estimatedDays ? `ETA: ${props.estimatedDays}` : "",
    "",
    `With care, the ${"LETTY"} team.`,
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: props.customerName
      ? `${props.customerName.split(/\s+/)[0]}, your LETTY order has shipped`
      : `Your LETTY order ${props.orderNumber} has shipped`,
    preheader: `Shipped via ${props.carrier}. Tracking attached.`,
  });
}

/* ---------- 2.D — orderDelivered ------------------------------------- */

export interface OrderDeliveredProps {
  customerName?: string;
  orderNumber: string;
  items: OrderItem[];
  /** Currency used to format the line-item prices in the recap. */
  currency: Currency;
  siteUrl: string;
}

export function orderDeliveredEmail(props: OrderDeliveredProps) {
  const first = props.customerName?.trim().split(/\s+/)[0];
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Delivered."),
    p(
      `${greet} your order <strong>${escapeHtml(props.orderNumber)}</strong> has arrived. We hope each piece becomes a small ritual.`,
      { lead: true },
    ),
    h2("Your pieces"),
    orderItemsTable(props.items, props.currency, props.siteUrl),
    divider(),
    // No review CTA here — the dedicated review-request email follows a week
    // later; asking twice reads as needy, not luxury.
    p(
      `Should anything about your order need attention, our concierge is one reply away.`,
      { muted: true },
    ),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Delivered.",
    `Order ${props.orderNumber} has arrived.`,
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: first
      ? `${first}, your LETTY order has been delivered`
      : `Your LETTY order ${props.orderNumber} has been delivered`,
    preheader: `Order ${props.orderNumber} has arrived.`,
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
  const first = props.customerName?.trim().split(/\s+/)[0];
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Payment did not complete."),
    p(
      `${greet} we could not finalise payment for order <strong>${escapeHtml(props.orderNumber)}</strong>. Nothing has been charged.`,
      { lead: true },
    ),
    props.reason ? p(`Reason: <em>${escapeHtml(props.reason)}</em>`, { muted: true }) : "",
    p(
      "Your bag is saved in your browser — return to checkout to secure your pieces. Availability is not guaranteed until payment completes.",
      { muted: true },
    ),
    lineButton("Return to your bag", props.resumeUrl),
    p("If the issue persists, write to <a href=\"mailto:lettybeautyco@gmail.com\">lettybeautyco@gmail.com</a> and we will assist personally.", { muted: true }),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Payment did not complete.",
    `Order ${props.orderNumber} could not be finalised. Nothing has been charged.`,
    props.reason ? `Reason: ${props.reason}` : "",
    `Resume checkout: ${props.resumeUrl}`,
    "",
    "Need help? lettybeautyco@gmail.com",
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: first
      ? `${first}, your payment did not go through`
      : `Payment for order ${props.orderNumber} did not complete`,
    preheader: `Nothing was charged — your bag is saved.`,
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
  const first = props.customerName?.trim().split(/\s+/)[0];
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  // Deep-link to the guest order-tracking page — recipients are often not
  // signed in, and /account/orders/[id] requires a session.
  const trackUrl = `${props.siteUrl}/account/orders?order=${encodeURIComponent(props.orderNumber)}`;
  const body = [
    h1("A refund has been issued."),
    p(
      `${greet} a refund of <strong>${formatMoney(props.amount, props.currency)}</strong> has been issued for order <strong>${escapeHtml(props.orderNumber)}</strong>.`,
      { lead: true },
    ),
    p("Funds typically settle within 5–10 business days, depending on your bank.", { muted: true }),
    props.restock ? p("Your pieces have been returned to inventory.", { muted: true }) : "",
    lineButton("View order", trackUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "A refund has been issued.",
    `Order ${props.orderNumber}: ${formatMoney(props.amount, props.currency)}`,
    "Funds typically settle within 5-10 business days.",
    `Track your order: ${trackUrl}`,
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: first
      ? `${first}, your refund has been issued`
      : `Refund issued for order ${props.orderNumber}`,
    preheader: `${formatMoney(props.amount, props.currency)} refund on the way.`,
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
      (it) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};">
          ${
            it.image_url
              ? `<img src="${escapeHtml(it.image_url)}" alt="" width="64" height="64" style="display:inline-block;vertical-align:middle;margin-right:14px;border:0;">`
              : ""
          }
          <span style="vertical-align:middle;">
            <strong>${escapeHtml(it.name)}</strong><br>
            <a href="${escapeHtml(`${props.siteUrl}/products/${it.slug}#reviews`)}" style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Write a review</a>
          </span>
        </td>
      </tr>`,
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
      (it) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};">
          ${
            it.image_url
              ? `<img src="${escapeHtml(it.image_url)}" alt="${escapeHtml(it.name)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid ${BRAND.line};">`
              : `<span style="display:block;width:64px;height:64px;line-height:64px;text-align:center;border-radius:8px;border:1px solid ${BRAND.line};background:${BRAND.bg};color:${BRAND.stone};font-family:Georgia,serif;">L</span>`
          }
          <span style="display:inline-block;vertical-align:top;margin-left:14px;">
            <strong>${escapeHtml(it.name)}</strong><br>
            <span class="muted" style="font-size:12px;">Qty ${it.quantity}</span>
          </span>
        </td>
      </tr>`,
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
