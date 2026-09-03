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
import { renderLayout, escapeHtml } from "./layout";

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

export function orderItemsTable(items: OrderItem[], currency: Currency): string {
  const rows = items
    .map(
      (it) => `<tr>
        <td>
          ${it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" width="48" height="48" style="display:inline-block;vertical-align:middle;margin-right:12px;border:0;">` : ""}
          <span style="vertical-align:middle;">
            ${escapeHtml(it.name)}
            ${it.variant ? `<br><span class="muted" style="font-size:12px;">${escapeHtml(it.variant)}</span>` : ""}
          </span>
        </td>
        <td class="num">${it.quantity}</td>
        <td class="num">${formatMoney(it.unit_price, currency)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <thead>
      <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th></tr>
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

/* ---------- 2.A — orderReceived -------------------------------------- */

export interface OrderReceivedProps {
  customerName?: string;
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: { street: string; city: string; state: string; country: string; postal?: string };
  siteUrl: string;
}

export function orderReceivedEmail(props: OrderReceivedProps) {
  const greet = props.customerName ? `Thank you, ${props.customerName}.` : "Thank you.";
  const body = [
    h1(greet),
    p(
      `Your order <strong>${escapeHtml(props.orderNumber)}</strong> has been received and is being prepared with care. We will send a confirmation as soon as payment clears.`,
      { lead: true },
    ),
    h2("Your pieces"),
    orderItemsTable(props.items, props.totals.currency),
    orderTotalsTable(props.totals),
    h2("Shipping to"),
    addressBlock(props.shippingAddress),
    divider(),
    p(
      `With care, <span class="accent">the ${"LETTY"} team</span>.`,
      { muted: true },
    ),
  ].join("\n");
  const text = [
    greet,
    `Order ${props.orderNumber} received. We will confirm once payment clears.`,
    "",
    "ITEMS",
    ...props.items.map(
      (i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} — ${formatMoney(i.unit_price, props.totals.currency)}`,
    ),
    "",
    `Subtotal: ${formatMoney(props.totals.subtotal, props.totals.currency)}`,
    `Shipping: ${formatMoney(props.totals.shipping, props.totals.currency)}`,
    `Tax: ${formatMoney(props.totals.tax, props.totals.currency)}`,
    `Total: ${formatMoney(props.totals.total, props.totals.currency)}`,
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: `We received your order ${props.orderNumber}`,
    preheader: `Order ${props.orderNumber} is being prepared.`,
  });
}

/* ---------- 2.B — orderConfirmation ---------------------------------- */

export interface OrderConfirmationProps {
  customerName?: string;
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: { street: string; city: string; state: string; country: string; postal?: string };
  trackingUrl?: string;
  siteUrl: string;
}

export function orderConfirmationEmail(props: OrderConfirmationProps) {
  const greet = props.customerName ? `Thank you, ${props.customerName}.` : "Thank you.";
  const body = [
    h1(greet),
    p(
      `Your order <strong>${escapeHtml(props.orderNumber)}</strong> is confirmed. Payment received; preparation begins shortly.`,
      { lead: true },
    ),
    h2("Your pieces"),
    orderItemsTable(props.items, props.totals.currency),
    orderTotalsTable(props.totals),
    h2("Shipping to"),
    addressBlock(props.shippingAddress),
    props.trackingUrl ? lineButton("Track your order", props.trackingUrl) : "",
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    greet,
    `Order ${props.orderNumber} confirmed.`,
    "",
    "ITEMS",
    ...props.items.map(
      (i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} — ${formatMoney(i.unit_price, props.totals.currency)}`,
    ),
    "",
    `Total: ${formatMoney(props.totals.total, props.totals.currency)}`,
    props.trackingUrl ? `Track: ${props.trackingUrl}` : "",
    "",
    `With care, the ${"LETTY"} team.`,
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: `Order ${props.orderNumber} confirmed`,
    preheader: `Order ${props.orderNumber} is confirmed.`,
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
    subject: `Your LETTY order ${props.orderNumber} has shipped`,
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
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Delivered."),
    p(
      `${greet} your order <strong>${escapeHtml(props.orderNumber)}</strong> has arrived. We hope each piece becomes a small ritual.`,
      { lead: true },
    ),
    h2("Your pieces"),
    orderItemsTable(props.items, props.currency),
    divider(),
    p(
      `If a moment allowed, we would be grateful for your review — it shapes the next collection.`,
      { muted: true },
    ),
    lineButton("Leave a review", `${props.siteUrl}/account/orders/${props.orderNumber}`),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Delivered.",
    `Order ${props.orderNumber} has arrived.`,
    `Review your order: ${props.siteUrl}/account/orders/${props.orderNumber}`,
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: `Your LETTY order ${props.orderNumber} has been delivered`,
    preheader: `Order ${props.orderNumber} has arrived.`,
  });
}

/* ---------- 2.E — paymentFailed -------------------------------------- */

export interface PaymentFailedProps {
  customerName?: string;
  orderNumber: string;
  reason?: string;
  retryUrl: string;
  siteUrl: string;
}

export function paymentFailedEmail(props: PaymentFailedProps) {
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Payment did not complete."),
    p(
      `${greet} we could not finalise payment for order <strong>${escapeHtml(props.orderNumber)}</strong>. Your pieces are still held.`,
      { lead: true },
    ),
    props.reason ? p(`Reason: <em>${escapeHtml(props.reason)}</em>`, { muted: true }) : "",
    lineButton("Retry payment", props.retryUrl),
    p("If the issue persists, write to <a href=\"mailto:lettybeautyco@gmail.com\">lettybeautyco@gmail.com</a> and we will assist personally.", { muted: true }),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "Payment did not complete.",
    `Order ${props.orderNumber} could not be finalised.`,
    props.reason ? `Reason: ${props.reason}` : "",
    `Retry: ${props.retryUrl}`,
    "",
    "Need help? lettybeautyco@gmail.com",
  ]
    .filter(Boolean)
    .join("\n");
  return renderLayout({
    body,
    text,
    subject: `Payment for order ${props.orderNumber} did not complete`,
    preheader: `Please retry payment to keep your pieces.`,
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
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("A refund has been issued."),
    p(
      `${greet} a refund of <strong>${formatMoney(props.amount, props.currency)}</strong> has been issued for order <strong>${escapeHtml(props.orderNumber)}</strong>.`,
      { lead: true },
    ),
    p("Funds typically settle within 5–10 business days, depending on your bank.", { muted: true }),
    props.restock ? p("Your pieces have been returned to inventory.", { muted: true }) : "",
    lineButton("View order", `${props.siteUrl}/account/orders/${props.orderNumber}`),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = [
    "A refund has been issued.",
    `Order ${props.orderNumber}: ${formatMoney(props.amount, props.currency)}`,
    "Funds typically settle within 5-10 business days.",
    "",
    `With care, the ${"LETTY"} team.`,
  ].join("\n");
  return renderLayout({
    body,
    text,
    subject: `Refund issued for order ${props.orderNumber}`,
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
    subject: `How are your LETTY pieces?`,
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
}) {
  const greet = props.customerName ? `Hi ${props.customerName},` : "Hello,";
  const body = [
    h1("Your bag is waiting."),
    p(
      `${greet} you left ${props.itemCount} item${props.itemCount === 1 ? "" : "s"} in your bag — ${formatMoney(props.total, props.currency)} total.`,
      { lead: true },
    ),
    p("Pieces are held briefly. When you are ready, your bag is one tap away.", { muted: true }),
    lineButton("Return to bag", props.cartUrl),
    divider(),
    p(`With care, <span class="accent">the ${"LETTY"} team</span>.`, { muted: true }),
  ].join("\n");
  const text = `Your bag is waiting. ${props.itemCount} item(s) — ${formatMoney(props.total, props.currency)}. Resume: ${props.cartUrl}`;
  return renderLayout({
    body,
    text,
    subject: "Your bag is waiting — LETTY",
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
  const text = `Welcome to LETTY — luxury hair, beauty, fragrance, and fashion. ${props.siteUrl}`;
  return renderLayout({
    body,
    text,
    subject: "Welcome to LETTY",
    preheader: "Signature packaging and two deluxe samples with every order.",
  });
}

/* ---------- 2.J — newOrderAlert (admin only) ------------------------- */

export function newOrderAlertEmail(props: {
  orderNumber: string;
  total: number;
  currency: Currency;
  customerEmail: string;
  gateway: "stripe" | "paystack";
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
