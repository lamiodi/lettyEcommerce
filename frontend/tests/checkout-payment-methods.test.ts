import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCheckoutPaymentExclusions,
  getKlarnaBrandName,
  getAfterpayBrandName,
} from "../src/lib/checkout-payment-methods";
import { products } from "../src/lib/mock/products";

test("Klarna shows for all regions across various countries and currencies", () => {
  const testCases = [
    ["GB", "GBP"],
    ["US", "USD"],
    ["CA", "CAD"],
    ["AU", "AUD"],
    ["DE", "EUR"],
    ["FR", "EUR"],
    ["JP", "JPY"],
    ["NG", "USD"],
    ["NG", "NGN"],
    ["NZ", "NZD"],
    ["BR", "BRL"],
  ];
  for (const [country, currency] of testCases) {
    const excluded = getCheckoutPaymentExclusions(country, currency);
    assert.ok(
      !excluded.includes("klarna"),
      `Klarna should not be excluded for ${country} in ${currency}`,
    );
  }
});

test("UK and supported destinations keep eligible methods", () => {
  assert.deepEqual(getCheckoutPaymentExclusions("GB", "GBP"), ["amazon_pay"]);
  for (const country of ["DE", "FR", "NL", "IE", "ES"]) {
    const excluded = getCheckoutPaymentExclusions(country, "EUR");
    assert.ok(!excluded.includes("klarna"));
    assert.ok(!excluded.includes("paypal"));
    assert.ok(excluded.includes("afterpay_clearpay"));
  }
  for (const country of ["US", "CA", "AU", "NZ"]) {
    const excluded = getCheckoutPaymentExclusions(country, "USD");
    assert.ok(!excluded.includes("klarna"));
    assert.ok(!excluded.includes("paypal"));
    assert.ok(!excluded.includes("afterpay_clearpay"));
  }
});

test("PayPal is excluded for unsupported currency while Klarna remains available", () => {
  const ngExcluded = getCheckoutPaymentExclusions("NG", "NGN");
  assert.ok(!ngExcluded.includes("klarna"));
  assert.ok(ngExcluded.includes("paypal"));
  assert.ok(ngExcluded.includes("afterpay_clearpay"));
});

test("getKlarnaBrandName provides localized hints", () => {
  assert.equal(getKlarnaBrandName("US").hint, "Pay in 4 interest-free installments");
  assert.equal(getKlarnaBrandName("CA").hint, "Pay in 4 interest-free installments");
  assert.equal(getKlarnaBrandName("AU").hint, "Pay in 4 interest-free installments");
  assert.equal(getKlarnaBrandName("NZ").hint, "Pay in 4 interest-free installments");
  assert.equal(getKlarnaBrandName("GB").hint, "Pay in 3 interest-free instalments");
  assert.equal(getKlarnaBrandName("DE").hint, "Pay in 3 interest-free instalments");
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

