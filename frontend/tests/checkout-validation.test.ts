import assert from "node:assert/strict";
import { test } from "node:test";
import { getCheckoutFieldErrors } from "../src/lib/checkout-validation";

const address = {
  firstName: "Ada", lastName: "Smith", address: "12 High Street", city: "London",
  state: "", postalCode: "SW1A 1AA", regionRequired: false,
  regionLabel: "County", postalRequired: true,
};

test("an empty form reports every required field before a payment is attempted", () => {
  const errors = getCheckoutFieldErrors({
    email: "",
    shipping: { ...address, firstName: " ", lastName: "", address: "", city: "", postalCode: "" },
  });
  assert.deepEqual(Object.keys(errors), ["email", "firstName", "lastName", "address", "city", "postalCode"]);
});

test("malformed email provides useful guidance; pasted surrounding whitespace is accepted", () => {
  assert.match(getCheckoutFieldErrors({ email: "bad-email", shipping: address }).email, /name@example.com/);
  assert.deepEqual(getCheckoutFieldErrors({ email: " ada@example.com ", shipping: address }), {});
});

test("separate billing errors use field IDs that users can navigate to", () => {
  const errors = getCheckoutFieldErrors({ email: "ada@example.com", shipping: address,
    billing: { ...address, firstName: "", lastName: "", address: "", city: "", postalCode: "", state: "", regionRequired: true, regionLabel: "Province" },
  });
  assert.deepEqual(Object.keys(errors), ["billingFirstName", "billingLastName", "billingAddress", "billingCity", "billingState", "billingPostalCode"]);
  assert.match(errors.billingState, /billing province/);
});

test("country rules allow optional regions and postal codes", () => {
  assert.deepEqual(getCheckoutFieldErrors({ email: "ada@example.com",
    shipping: { ...address, state: "", postalCode: "", postalRequired: false },
  }), {});
  assert.match(getCheckoutFieldErrors({ email: "ada@example.com",
    shipping: { ...address, regionRequired: true, regionLabel: "State" },
  }).state, /state/);
});
