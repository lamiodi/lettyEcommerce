/**
 * Send one live preview of every LETTY email template to a given address.
 * Uses realistic sample data — safe to run against any inbox.
 *
 * Run: npx tsx scripts/send-email-previews.ts <recipient@example.com>
 */
import "dotenv/config";
import { Resend } from "resend";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderReadyForPickupEmail,
  orderDeliveredEmail,
  customerSatisfactionSurveyEmail,
  paymentFailedEmail,
  refundIssuedEmail,
  reviewRequestEmail,
  abandonedCartEmail,
  passwordResetEmail,
  welcomeEmail,
  newsletterWelcomeEmail,
  newOrderAlertEmail,
  contactAutoReplyEmail,
  contactConciergePingEmail,
} from "../lib/email/templates";

const to = process.argv[2];
if (!to || !to.includes("@")) {
  console.error("Usage: npx tsx scripts/send-email-previews.ts <recipient@example.com>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY missing — cannot send. Set it in backend/.env");
  process.exit(1);
}
const resend = new Resend(apiKey);
const from = process.env.EMAIL_FROM || "LETTY <hello@houseofletty.com>";

const siteUrl = "https://www.houseofletty.com";
const orderNumber = "L0328159";
const items = [
  {
    name: "LETTY Signature Lip Liner — 01 Café Crème",
    variant: "01 Café Crème",
    quantity: 1,
    unit_price: 34,
    image_url:
      "https://res.cloudinary.com/jtsxpm1l/image/upload/f_auto,q_auto/v1/letty/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
  },
];
const reviewItems = [
  {
    name: "LETTY Signature Lip Liner — 01 Café Crème",
    slug: "signature-lip-liner",
    image_url:
      "https://res.cloudinary.com/jtsxpm1l/image/upload/f_auto,q_auto/v1/letty/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG",
  },
];
const address = {
  recipientName: "Jawaun Pugh",
  street: "1500 Walton Reserve Blvd, Apt 8308",
  city: "Austell",
  state: "GA",
  country: "US",
  postal: "30168",
};
const totals = {
  subtotal: 34,
  discount: 3.4,
  gift_card: 5,
  shipping: 6.99,
  tax: 0,
  taxIncluded: true,
  total: 32.59,
  currency: "USD" as const,
};

const previews: Array<{ label: string; tpl: { subject: string; html: string; text?: string } }> = [
  {
    label: "Order Confirmation",
    tpl: orderConfirmationEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      items,
      totals,
      shippingAddress: address,
      billingAddress: address,
      orderDate: "2026-10-04T12:00:00Z",
      paymentMethod: "Visa ending in 1881",
      deliveryMethod: "UPS Standard Tracked",
      trackingUrl: `${siteUrl}/account/orders?order=${orderNumber}`,
      siteUrl,
    }),
  },
  {
    label: "Order Shipped",
    tpl: orderShippedEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      carrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      trackingUrl: `https://track.aftership.com/1Z999AA10123456784`,
      items,
      currency: "USD",
      siteUrl,
    }),
  },
  {
    label: "Ready for Pickup",
    tpl: orderReadyForPickupEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      trackingUrl: `${siteUrl}/account/orders?order=${orderNumber}`,
      siteUrl,
    }),
  },
  {
    label: "Order Delivered",
    tpl: orderDeliveredEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      orderPlacedDate: "2026-10-04T12:00:00Z",
      deliveryDate: "2026-10-11T18:00:00Z",
      deliveryMethod: "ups",
      shippingAddress: address,
      billingAddress: address,
      items,
      currency: "USD",
      siteUrl,
    }),
  },
  {
    label: "Customer Satisfaction Survey (unused)",
    tpl: customerSatisfactionSurveyEmail({ customerName: "Jawaun Pugh", orderNumber, siteUrl }),
  },
  {
    label: "Payment Failed",
    tpl: paymentFailedEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      reason: "Your bank declined the charge.",
      resumeUrl: `${siteUrl}/cart`,
      siteUrl,
    }),
  },
  {
    label: "Refund Issued",
    tpl: refundIssuedEmail({
      customerName: "Jawaun Pugh",
      orderNumber,
      amount: 34,
      currency: "USD",
      restock: true,
      siteUrl,
    }),
  },
  {
    label: "Review Request",
    tpl: reviewRequestEmail({ customerName: "Jawaun Pugh", items: reviewItems, siteUrl }),
  },
  {
    label: "Abandoned Cart",
    tpl: abandonedCartEmail({
      customerName: "Jawaun Pugh",
      cartUrl: `${siteUrl}/cart`,
      itemCount: 1,
      currency: "USD",
      total: 34,
      items: [{ name: items[0].name, quantity: 1, image_url: items[0].image_url }],
    }),
  },
  {
    label: "Password Reset",
    tpl: passwordResetEmail({
      customerName: "Jawaun Pugh",
      resetUrl: `${siteUrl}/reset-password?token=PREVIEW_ONLY`,
      siteUrl,
    }),
  },
  {
    label: "Welcome (account registered)",
    tpl: welcomeEmail({ customerName: "Jawaun", siteUrl }),
  },
  {
    label: "Newsletter Welcome",
    tpl: newsletterWelcomeEmail({ siteUrl }),
  },
  {
    label: "New Order Alert (owner)",
    tpl: newOrderAlertEmail({
      orderNumber,
      total: 32.59,
      currency: "USD",
      customerEmail: "client@example.com",
      gateway: "stripe",
      adminUrl: `${siteUrl}/admin/orders`,
    }),
  },
  {
    label: "Contact Auto-Reply",
    tpl: contactAutoReplyEmail({ customerName: "Jawaun Pugh", siteUrl }),
  },
  {
    label: "Contact Concierge Ping (owner)",
    tpl: contactConciergePingEmail({
      customerName: "Jawaun Pugh",
      customerEmail: "client@example.com",
      message: "Preview sample — do the concierge alerts look right?",
      adminUrl: `${siteUrl}/admin`,
    }),
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log(`Sending ${previews.length} email previews to ${to} from ${from} ...\n`);
  let ok = 0;
  let failed = 0;
  for (const { label, tpl } of previews) {
    const subject = `[LETTY PREVIEW] ${tpl.subject}`;
    try {
      const res = await resend.emails.send({
        from,
        to,
        subject,
        html: tpl.html,
        text: tpl.text,
        tags: [
          { name: "type", value: "preview" },
          { name: "template", value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        ],
      });
      if (res.error) {
        failed++;
        console.log(`✗ ${label}: ${res.error.message} (code ${res.error.name})`);
      } else {
        ok++;
        console.log(`✓ ${label}: sent (${res.data?.id})`);
      }
    } catch (err) {
      failed++;
      console.log(`✗ ${label}: ${(err as Error).message}`);
    }
    await sleep(400);
  }
  console.log(`\nDone — ${ok} sent, ${failed} failed.`);
})();
