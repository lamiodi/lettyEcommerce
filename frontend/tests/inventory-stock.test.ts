import assert from "node:assert/strict";
import { test } from "node:test";
import { availableStock } from "../src/lib/inventory-stock";
test("reserved units cannot be advertised as available stock", () => {
  assert.equal(availableStock({ stockQuantity: 10, reservedQuantity: 8 }), 2);
  assert.equal(availableStock({ stockQuantity: 3, reservedQuantity: 5 }), 0);
});
test("unconfirmed or invalid inventory never creates a stock allocation", () => {
  assert.equal(availableStock(), 0);
  assert.equal(availableStock({ stockQuantity: NaN, reservedQuantity: 0 }), 0);
  assert.equal(availableStock({ stockQuantity: 5, reservedQuantity: -3 }), 5);
});
