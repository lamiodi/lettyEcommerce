import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { executePostPayment } from "../lib/orders/post-payment";

let scenario: "unpaid" | "claim-error" | "duplicate" | "queued-replay" = "unpaid";
let requests: string[] = [];
const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const server = createServer((request, response) => {
  requests.push(`${request.method} ${request.url?.split("?")[0]}`);
  response.setHeader("Content-Type", "application/json");
  if (request.method === "GET" && request.url?.startsWith("/rest/v1/orders?")) {
    response.end(JSON.stringify({ id: "test-order", order_number: "TEST", payment_status: scenario === "unpaid" ? "pending" : "paid",
      customer_email: "reader@example.com", currency: "GBP", subtotal: 17, discount_total: 0, gift_card_total: 0,
      shipping_total: 0, tax_total: 0, total: 17, order_items: [],
    }));
  } else if (request.method === "POST" && request.url?.startsWith("/rest/v1/order_events")) {
    const duplicate = scenario === "duplicate" || scenario === "queued-replay";
    response.statusCode = duplicate ? 409 : 400;
    response.end(JSON.stringify({ code: duplicate ? "23505" : "XX000", message: "Simulated claim result" }));
  } else if (request.method === "GET" && request.url?.startsWith("/rest/v1/order_events?")) {
    response.end(JSON.stringify({ metadata: scenario === "queued-replay" ? { confirmation_outbox: true } : {} }));
  } else if (request.method === "POST" && request.url?.startsWith("/rest/v1/email_outbox")) {
    response.statusCode = 201; response.end();
  } else if (request.method === "PATCH" && request.url?.startsWith("/rest/v1/email_outbox")) {
    response.end("null");
  } else {
    response.statusCode = 500;
    response.end(JSON.stringify({ message: "Unexpected side effect in guard test" }));
  }
});

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
});

after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
});

test("an unpaid order cannot commit stock or send a payment confirmation", async () => {
  scenario = "unpaid";
  requests = [];
  const result = await executePostPayment("test-reference");
  assert.equal(result.ok, false);
  assert.deepEqual(requests, ["GET /rest/v1/orders"]);
});

test("a database claim failure is retryable rather than reported as duplicate success", async () => {
  scenario = "claim-error";
  requests = [];
  const result = await executePostPayment("test-reference");
  assert.equal(result.ok, false);
  assert.equal(result.idempotent, undefined);
  assert.deepEqual(requests, ["GET /rest/v1/orders", "POST /rest/v1/order_events"]);
});

test("a real duplicate claim does not repeat inventory or email processing", async () => {
  scenario = "duplicate";
  requests = [];
  const result = await executePostPayment("test-reference");
  assert.equal(result.ok, true);
  assert.equal(result.idempotent, true);
  assert.deepEqual(requests, ["GET /rest/v1/orders", "POST /rest/v1/order_events", "GET /rest/v1/order_events"]);
});

test("a current payment replay can recover its email queue without repeating fulfillment", async () => {
  scenario = "queued-replay";
  requests = [];
  const result = await executePostPayment("test-reference");
  assert.equal(result.ok, true);
  assert.equal(result.idempotent, true);
  assert.deepEqual(requests, ["GET /rest/v1/orders", "POST /rest/v1/order_events", "GET /rest/v1/order_events", "POST /rest/v1/email_outbox", "PATCH /rest/v1/email_outbox"]);
});
