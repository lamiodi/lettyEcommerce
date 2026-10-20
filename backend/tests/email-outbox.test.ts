import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { before, after, test } from "node:test";
import { queueConfirmation, deliverQueuedEmail } from "../lib/email/outbox";
import type { SendEmailInput } from "../lib/email/resend";

type Row = { id: string; dedupe_key: string; payload: SendEmailInput; attempts: number; next_attempt_at: string; locked_until?: string | null; lock_token?: string | null; sent_at?: string | null; provider_id?: string; last_error?: string | null };
let row: Row | null = null;
let unavailable = false;
const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (unavailable) { res.statusCode = 503; res.end(JSON.stringify({ code: "TEST", message: "unavailable" })); return; }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const query = new URL(req.url!, "http://localhost").searchParams;
  if (req.method === "POST") {
    row ??= { ...body, id: "queue-row", attempts: 0, next_attempt_at: new Date(0).toISOString() };
    res.statusCode = 201; res.end(); return;
  }
  if (req.method === "PATCH" && query.has("dedupe_key")) {
    if (!row || row.sent_at || (row.locked_until && Date.parse(row.locked_until) > Date.now()) || Date.parse(row.next_attempt_at) > Date.now()) {
      res.end("null"); return;
    }
    Object.assign(row, body);
    res.end(JSON.stringify(row)); return;
  }
  if (req.method === "PATCH") {
    assert.equal(query.get("lock_token"), `eq.${row?.lock_token}`);
    Object.assign(row!, body);
    res.statusCode = 204; res.end(); return;
  }
  res.statusCode = 500; res.end(JSON.stringify({ message: "Unexpected request" }));
});
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
  if (previous.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.key;
});
const message: SendEmailInput = { to: "reader@example.com", subject: "Preorder confirmed", html: "<p>Paid preorder</p>", text: "Paid preorder", priority: "critical" };

test("a failed provider send stays queued and retries the original receipt with the same provider key", async () => {
  row = null;
  const key = await queueConfirmation("order-1", message);
  assert.equal(await deliverQueuedEmail(key, async (input) => { assert.equal(input.idempotencyKey, key); return null; }), "pending");
  const failed = row as unknown as Row;
  assert.equal(failed.attempts, 1);
  assert.equal(failed.sent_at, undefined);
  assert.ok(Date.parse(failed.next_attempt_at) > Date.now());
  await queueConfirmation("order-1", { ...message, subject: "Changed receipt" });
  failed.next_attempt_at = new Date(0).toISOString();
  assert.equal(await deliverQueuedEmail(key, async (input) => {
    assert.equal(input.subject, message.subject);
    assert.equal(input.idempotencyKey, key);
    return { id: "provider-1" };
  }), "sent");
  assert.equal(failed.provider_id, "provider-1");
  assert.ok(failed.sent_at);
});
test("concurrent workers and later replays do not resend an accepted confirmation", async () => {
  row = null;
  const key = await queueConfirmation("order-2", message);
  let sends = 0;
  const sender = async () => { sends++; return { id: "provider-2" }; };
  const results = await Promise.all([deliverQueuedEmail(key, sender), deliverQueuedEmail(key, sender)]);
  assert.deepEqual(results.sort(), ["sent", "skipped"]);
  assert.equal(await deliverQueuedEmail(key, sender), "skipped");
  assert.equal(sends, 1);
});
test("a crashed worker lease expires and a later worker can deliver", async () => {
  row = null;
  const key = await queueConfirmation("order-3", message);
  (row as unknown as Row).locked_until = new Date(Date.now() - 60_000).toISOString();
  assert.equal(await deliverQueuedEmail(key, async () => ({ id: "recovered" })), "sent");
});
test("a queue database failure never calls the email provider", async () => {
  unavailable = true;
  let sends = 0;
  await assert.rejects(queueConfirmation("order-4", message));
  await assert.rejects(deliverQueuedEmail("order-confirmation/order-4", async () => { sends++; return { id: "unexpected" }; }));
  assert.equal(sends, 0);
  unavailable = false;
});
