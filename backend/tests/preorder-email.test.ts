import assert from "node:assert/strict";
import { test } from "node:test";
import { orderConfirmationEmail, type OrderConfirmationProps } from "../lib/email/templates";
import { createPreorderSnapshot, readPreorderSnapshot } from "../lib/orders/preorder";
import { MWAH_DISPATCH, MWAH_SLUG } from "../lib/orders/preorder-catalog";
import { formatEmailImageUrl } from "../lib/email/brand";

const base: OrderConfirmationProps = {
  customerName: "Preview Customer",
  orderNumber: "L0TEST01",
  orderDate: "2026-10-18T12:00:00Z",
  siteUrl: "https://www.houseofletty.com",
  items: [{ name: "LETTY mwah Lip Balm", variant: "Edition: Ivory / Size: 10 ml", quantity: 1, unit_price: 17, preorder: { dispatch: MWAH_DISPATCH } }],
  totals: { currency: "GBP", subtotal: 17, shipping: 3.99, tax: 0, total: 20.99 },
  shippingAddress: { street: "Preview address", city: "London", state: "", country: "GB", postal: "SW1A 1AA" },
};

test("preorder receipt confirms payment, edition, quantity and estimated dispatch in both formats", () => {
  const email = orderConfirmationEmail(base);
  assert.equal(email.subject, "Preorder L0TEST01 confirmed");
  for (const output of [email.html, email.text]) {
    assert.match(output, /payment has been received/i);
    assert.match(output, /Ivory/);
    assert.ok(output.includes(MWAH_DISPATCH));
    assert.match(output, /Delivery time starts after dispatch/);
    assert.doesNotMatch(output, /now being prepared/);
  }
  assert.match(email.html, /Quantity: 1/);
  assert.match(email.text, /£20\.99/);
  assert.doesNotMatch(email.html, /class="header-nav"|2 samples offered/);
  assert.doesNotMatch(email.html.replace(/<!--[\s\S]*?-->/g, "") + email.text + email.subject, /—/);
});

test("mixed orders retain all items and totals without promising separate shipments", () => {
  const email = orderConfirmationEmail({
    ...base,
    items: [...base.items, { name: "LETTY Lash Book Kit", quantity: 1, unit_price: 12 }],
    totals: { ...base.totals, subtotal: 29, total: 32.99 },
  });
  assert.match(email.text, /includes items that are not preorders/);
  assert.match(email.text, /LETTY Lash Book Kit/);
  assert.match(email.text, /£32\.99/);
  assert.doesNotMatch(email.text, /separate shipments|ships immediately/);
});

test("ordinary paid orders retain their existing confirmation", () => {
  const email = orderConfirmationEmail({ ...base, items: [{ name: "LETTY Lash Book Kit", quantity: 1, unit_price: 12 }] });
  assert.equal(email.subject, "Order L0TEST01 confirmed");
  assert.match(email.html, /now being prepared/);
  assert.doesNotMatch(email.html + email.text, /Your preorder|PREORDER DETAILS|Estimated dispatch/);
});

test("a missing dispatch window stays unconfirmed and customer data is escaped", () => {
  const email = orderConfirmationEmail({ ...base, customerName: '<img src=x onerror="alert(1)">', items: [{ name: "<script>example</script>", variant: "Noir & Ivory", quantity: 2, unit_price: 17, preorder: { dispatch: null } }] });
  assert.match(email.html, /&lt;script&gt;example&lt;\/script&gt;/);
  assert.match(email.html, /Noir &amp; Ivory/);
  assert.doesNotMatch(email.html, /<script>|<img src=x/);
  assert.match(email.text, /confirm your estimated dispatch window by email/);
  assert.ok(!email.text.includes(MWAH_DISPATCH));
});

test("checkout snapshots preserve original dates and normal items stay normal", () => {
  assert.deepEqual(createPreorderSnapshot(MWAH_SLUG), { is_preorder: true, preorder_dispatch: MWAH_DISPATCH });
  assert.deepEqual(createPreorderSnapshot("letty-lash-book-kit"), { is_preorder: false, preorder_dispatch: null });
  assert.deepEqual(readPreorderSnapshot({ slug: MWAH_SLUG, is_preorder: true, preorder_dispatch: "December 2026" }), { dispatch: "December 2026" });
  assert.equal(readPreorderSnapshot({ slug: MWAH_SLUG, is_preorder: false }), null);
  assert.deepEqual(readPreorderSnapshot({ slug: MWAH_SLUG }), { dispatch: MWAH_DISPATCH });
  assert.equal(readPreorderSnapshot({ slug: "letty-lash-book-kit" }), null);
  assert.equal(readPreorderSnapshot(null), null);
});

test("new mwah receipt images use the existing storefront assets", () => {
  assert.equal(formatEmailImageUrl("/products/mwah/mwah-ivory.webp"), "https://www.houseofletty.com/products/mwah/mwah-ivory.webp");
  assert.equal(formatEmailImageUrl("/products/mwah/mwah-noir.webp"), "https://www.houseofletty.com/products/mwah/mwah-noir.webp");
});
