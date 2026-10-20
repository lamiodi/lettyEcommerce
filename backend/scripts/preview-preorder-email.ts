/** Build a local preview without sending email or changing orders. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { orderConfirmationEmail } from "../lib/email/templates";
import { MWAH_DISPATCH } from "../lib/orders/preorder-catalog";

const preview = orderConfirmationEmail({
  customerName: "LETTY Customer",
  orderNumber: "PREVIEW",
  orderDate: "2026-10-18T12:00:00Z",
  deliveryMethod: "Tracked delivery",
  paymentMethod: "Card or digital wallet",
  items: [{ name: "LETTY mwah Lip Balm", variant: "Edition: Ivory / Size: 10 ml", quantity: 1, unit_price: 17, image_url: "/products/mwah/mwah-ivory.webp", preorder: { dispatch: MWAH_DISPATCH } }],
  totals: { currency: "GBP", subtotal: 17, shipping: 3.99, tax: 0, total: 20.99 },
  shippingAddress: { recipientName: "LETTY Customer", street: "Example address", city: "London", state: "", country: "United Kingdom" },
  siteUrl: "https://www.houseofletty.com",
});

const directory = join(process.cwd(), "public", "email-previews");
mkdirSync(directory, { recursive: true });
const html = process.argv.includes("--local-assets")
  ? preview.html.replaceAll("https://www.houseofletty.com/products/mwah/", "http://localhost:3000/products/mwah/")
  : preview.html;
writeFileSync(join(directory, "preview-preorder-confirmation.html"), html);
writeFileSync(join(directory, "preview-preorder-confirmation.txt"), preview.text);
