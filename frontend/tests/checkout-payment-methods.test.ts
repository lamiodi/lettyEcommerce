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

test("mwah Lip Balm preorder has distinct Ivory and Noir editions with stable identifiers", () => {
  const mwah = products.find((item) => item.slug === "letty-mwah-lip-balm");
  assert.ok(mwah, "mwah product exists in catalog");
  assert.equal(mwah.isPreorder, true);
  assert.equal(mwah.variants.length, 2);

  const ivory = mwah.variants.find((v) => v.sku === "LET-MWAH-IV");
  const noir = mwah.variants.find((v) => v.sku === "LET-MWAH-NR");
  assert.ok(ivory, "Ivory edition variant exists");
  assert.ok(noir, "Noir edition variant exists");
  assert.notEqual(ivory.id, noir.id, "Ivory and Noir must have distinct IDs");
  assert.ok(ivory.color?.includes("Ivory"));
  assert.ok(noir.color?.includes("Noir"));
});

