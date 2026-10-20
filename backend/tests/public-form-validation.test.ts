import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { NextRequest } from "next/server";
import { POST as contact } from "../app/api/contact/route";
import { POST as newsletter } from "../app/api/newsletter/route";
import { POST as waitlist } from "../app/api/waitlist/route";
import { POST as register } from "../app/api/customer/auth/register/route";
const originalFetch = globalThis.fetch;
before(() => { globalThis.fetch = async () => { throw new Error("Validation tests cannot call external services"); }; });
after(() => { globalThis.fetch = originalFetch; });
const cases = [
  ["contact rejects whitespace-only messages", contact, { name: "Reader", email: "reader@example.com", message: "          " }],
  ["newsletter rejects malformed email", newsletter, { email: "invalid" }],
  ["restock requests require a product option", waitlist, { email: "reader@example.com" }],
  ["restock requests reject filter injection", waitlist, { email: "reader@example.com", variant_id: "x,id.not.is.null" }],
  ["account setup requires an email", register, { firstName: "Reader" }],
] as const;
for (const [name, handler, body] of cases) test(name, async () => {
  const response = await handler(new NextRequest("http://localhost/api/validation-test", {
    method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.19" }, body: JSON.stringify(body),
  }), undefined);
  assert.equal(response.status, 400);
  assert.ok((await response.json()).error);
});
