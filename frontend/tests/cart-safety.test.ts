import assert from "node:assert/strict";
import { test } from "node:test";
import { products } from "../src/lib/mock/products";
import { normalizeCartLines } from "../src/lib/cart-lines";
import { detailCartLines } from "../src/lib/cart-details";
import { safeRedirectPath } from "../src/lib/safe-redirect";
const product = products.find(item => item.slug === "letty-velvet-lip-liner")!;
const line = { productSlug: product.slug, variantId: product.variants[0].id, quantity: 1 };
test("stale or mismatched variants are discarded rather than silently choosing another shade", () => {
  assert.deepEqual(normalizeCartLines([{ ...line, variantId: "deleted-variant" }]), []);
  assert.deepEqual(detailCartLines([{ ...line, variantId: "deleted-variant" }]), []);
  assert.deepEqual(normalizeCartLines([{ ...line, productSlug: "letty-glass-lip-gloss" }]), []);
});
test("persisted cart quantities stay finite integers within the checkout limit", () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity, "3"]) assert.deepEqual(normalizeCartLines([{ ...line, quantity }]), []);
  assert.equal(normalizeCartLines([{ ...line, quantity: 120 }])[0].quantity, 99);
  assert.equal(normalizeCartLines([line, { ...line, quantity: 2 }])[0].quantity, 3);
  assert.deepEqual(normalizeCartLines({ lines: [line] }), []);
});
test("valid shades and cart totals are preserved", () => {
  const valid = { ...line, quantity: 2 };
  assert.deepEqual(normalizeCartLines([valid]), [valid]);
  assert.equal(detailCartLines([valid])[0].lineTotal, 18);
});
test("login redirects remain on the storefront, including encoded attacks", () => {
  assert.equal(safeRedirectPath("/checkout?from=login"), "/checkout?from=login");
  for (const path of [null, "https://evil.example", "//evil.example", "javascript:alert(1)", "/%5c%5cevil.example", "/%2fexample.com", "/%00evil", "%"]) assert.equal(safeRedirectPath(path), "/");
});
