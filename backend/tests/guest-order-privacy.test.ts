import assert from "node:assert/strict";
import { test } from "node:test";
import { guestOrderSummary } from "../lib/orders/public-summary";
test("guest tracking exposes progress without addresses, phone numbers or internal notes", () => {
  const summary = guestOrderSummary({ id: "order-1", order_number: "L000001", total: 12, currency: "GBP",
    shipping_address: { street: "private street" }, shipping_address_id: "address-1", billing_address_id: "address-2",
    customer_email: "private@example.com", customer_phone: "private phone", customer: { first_name: "Private" },
    tracking_number: "tracking-1", payment_status: "paid", order_items: [],
    order_events: [{ event_type: "shipped", created_at: "2026-10-19", metadata: { note: "private note" } }],
  });
  assert.equal(summary.order_number, "L000001"); assert.equal(summary.tracking_number, "tracking-1");
  assert.equal(summary.total, 12); assert.equal(JSON.stringify(summary).includes("private"), false);
  assert.equal("customer" in summary, false); assert.equal("shipping_address_id" in summary, false);
  assert.deepEqual(summary.order_events, [{ event_type: "shipped", created_at: "2026-10-19" }]);
});
