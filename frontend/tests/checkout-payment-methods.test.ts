import assert from "node:assert/strict";
import { test } from "node:test";
import { getCheckoutPaymentExclusions } from "../src/lib/checkout-payment-methods";
import { products } from "../src/lib/mock/products";

test("Canadian CAD checkout keeps PayPal and excludes Klarna unavailable to a UK merchant", () => {
  const excluded = getCheckoutPaymentExclusions("CA", "CAD");
  assert.ok(!excluded.includes("paypal"));
  assert.ok(excluded.includes("klarna"));
  assert.ok(excluded.includes("afterpay_clearpay"));
});

test("UK and supported euro destinations keep eligible methods", () => {
  assert.deepEqual(getCheckoutPaymentExclusions("GB", "GBP"), ["amazon_pay"]);
  for (const country of ["DE", "FR", "NL", "IE", "ES"]) {
    const excluded = getCheckoutPaymentExclusions(country, "EUR");
    assert.ok(!excluded.includes("klarna"));
    assert.ok(!excluded.includes("paypal"));
    assert.ok(excluded.includes("afterpay_clearpay"));
  }
});

test("destination and currency changes cannot retain unsupported BNPL or PayPal", () => {
  for (const [country, currency] of [["US", "USD"], ["NG", "USD"], ["AU", "USD"], ["DE", "GBP"]]) {
    const excluded = getCheckoutPaymentExclusions(country, currency);
    assert.ok(excluded.includes("klarna"));
    assert.ok(excluded.includes("afterpay_clearpay"));
    assert.ok(!excluded.includes("paypal"));
  }
  assert.ok(getCheckoutPaymentExclusions("NG", "NGN").includes("paypal"));
});

test("Lash Book is a regular £12 product without a stale variant price", () => {
  const product = products.find((item) => item.slug === "letty-lash-book-kit");
  assert.ok(product);
  assert.equal(product.basePriceUsd, 12);
  assert.equal(product.isPreorder, false);
  for (const variant of product.variants) {
    assert.equal(variant.priceOverrideUsd ?? product.basePriceUsd, 12);
  }
});
