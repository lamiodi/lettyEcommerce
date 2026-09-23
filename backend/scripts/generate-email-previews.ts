/**
 * Standalone preview generator for LETTY's Maison Francis Kurkdjian-inspired email templates.
 * Run: npx tsx scripts/generate-email-previews.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  orderReadyForPickupEmail,
  orderDeliveredEmail,
  customerSatisfactionSurveyEmail,
  orderConfirmationEmail,
  orderShippedEmail,
} from "../lib/email/templates";

const OUT_DIR = path.join(__dirname, "..", "public", "email-previews");
fs.mkdirSync(OUT_DIR, { recursive: true });

const siteUrl = "https://www.houseofletty.com";

// 1. Ready for Pickup (PDF 1)
const pickup = orderReadyForPickupEmail({
  customerName: "Jawaun Pugh",
  orderNumber: "U0328159",
  trackingUrl: `${siteUrl}/account/orders?order=U0328159`,
  siteUrl,
});
fs.writeFileSync(path.join(OUT_DIR, "preview-ready-for-pickup.html"), pickup.html);
console.log("Generated: preview-ready-for-pickup.html (PDF 1)");

// 2. Order Delivered (PDF 2)
const delivered = orderDeliveredEmail({
  customerName: "Jawaun Pugh",
  orderNumber: "U0328159",
  orderPlacedDate: "2026-01-06T12:00:00Z",
  deliveryDate: "2026-01-12T18:00:00Z",
  deliveryMethod: "ups",
  shippingAddress: {
    street: "1500 WALTON RESERVE BLVD\nApt 8308",
    city: "Austell",
    state: "GA",
    country: "US",
    postal: "30168",
  },
  billingAddress: {
    street: "1500 WALTON RESERVE BLVD\nApt 8308",
    city: "Austell",
    state: "GA",
    country: "US",
    postal: "30168",
  },
  siteUrl,
});
fs.writeFileSync(path.join(OUT_DIR, "preview-order-delivered.html"), delivered.html);
console.log("Generated: preview-order-delivered.html (PDF 2)");

// 3. Customer Satisfaction / NPS Survey (PDF 3)
const survey = customerSatisfactionSurveyEmail({
  customerName: "Jawaun Pugh",
  orderNumber: "U0328159",
  siteUrl,
});
fs.writeFileSync(path.join(OUT_DIR, "preview-satisfaction-survey.html"), survey.html);
console.log("Generated: preview-satisfaction-survey.html (PDF 3)");

// 4. Order Confirmation
const confirmation = orderConfirmationEmail({
  customerName: "Jawaun Pugh",
  orderNumber: "U0328159",
  orderDate: "2026-01-06T12:00:00Z",
  deliveryMethod: "UPS Ground Tracked",
  paymentMethod: "Visa ending in 4242",
  items: [
    {
      name: "Baccarat Rouge Extrait de Parfum",
      quantity: 1,
      unit_price: 385,
      variant: "70ml",
      image_url: `${siteUrl}/images/deptFragranceEditorial.png`,
    },
    {
      name: "Grand Soir Eau de Parfum",
      quantity: 1,
      unit_price: 240,
      variant: "70ml",
      image_url: `${siteUrl}/images/deptFragranceEditorial.png`,
    },
  ],
  totals: {
    currency: "USD",
    subtotal: 625,
    shipping: 0,
    tax: 43.75,
    total: 668.75,
  },
  shippingAddress: {
    recipientName: "Jawaun Pugh",
    street: "1500 WALTON RESERVE BLVD, Apt 8308",
    city: "Austell",
    state: "GA",
    country: "US",
    postal: "30168",
  },
  siteUrl,
});
fs.writeFileSync(path.join(OUT_DIR, "preview-order-confirmation.html"), confirmation.html);
console.log("Generated: preview-order-confirmation.html");

// 5. Order Shipped
const shipped = orderShippedEmail({
  customerName: "Jawaun Pugh",
  orderNumber: "U0328159",
  carrier: "UPS Ground",
  trackingNumber: "1Z9999999999999999",
  trackingUrl: "https://www.ups.com/track?tracknum=1Z9999999999999999",
  estimatedDays: "2-3 business days",
  siteUrl,
});
fs.writeFileSync(path.join(OUT_DIR, "preview-order-shipped.html"), shipped.html);
console.log("Generated: preview-order-shipped.html");

console.log(`All previews saved to: ${OUT_DIR}`);
