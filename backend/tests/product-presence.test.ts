import assert from "node:assert/strict";
import { test } from "node:test";
import { ProductPresence } from "../lib/product-presence";

test("heartbeats count unique viewers rather than polling requests", () => {
  const presence = new ProductPresence();
  assert.equal(presence.heartbeat("lip-balm", "first-viewer", true, 0), 1);
  assert.equal(presence.heartbeat("lip-balm", "first-viewer", true, 20_000), 1);
  assert.equal(presence.heartbeat("lip-balm", "second-viewer", true, 20_000), 2);
});

test("inactive sessions leave immediately and abandoned sessions expire", () => {
  const presence = new ProductPresence();
  presence.heartbeat("lip-balm", "first", true, 0);
  presence.heartbeat("lip-balm", "second", true, 0);
  assert.equal(presence.heartbeat("lip-balm", "first", false, 1000), 1);
  assert.equal(presence.heartbeat("lip-balm", "third", true, 60_000), 1);
});

test("viewing counts are isolated to the selected product", () => {
  const presence = new ProductPresence();
  presence.heartbeat("lip-balm", "same-viewer", true, 0);
  assert.equal(presence.heartbeat("lip-liner", "same-viewer", true, 0), 1);
  assert.equal(presence.heartbeat("lip-balm", "second-viewer", true, 0), 2);
});
