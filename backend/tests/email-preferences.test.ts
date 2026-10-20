import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { before, after, test } from "node:test";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { createUnsubscribeUrl, readUnsubscribeEmail, hasEmailSubscription } from "../lib/email/preferences";
import { POST } from "../app/api/newsletter/unsubscribe/route";

const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, secret: process.env.EMAIL_PREFERENCES_SECRET };
let subscribed = true;
let writes = 0;
let unavailable = false;
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (unavailable) { res.statusCode = 503; res.end(JSON.stringify({ code: "TEST", message: "unavailable" })); return; }
  if (req.method === "GET") { res.end(JSON.stringify({ is_subscribed: subscribed })); return; }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  assert.equal(body.email, "reader@example.com");
  assert.equal(body.is_subscribed, false);
  assert.ok(body.unsubscribed_at);
  subscribed = false;
  writes++;
  res.statusCode = 201;
  res.end();
});
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
  process.env.EMAIL_PREFERENCES_SECRET = "test-email-preferences-secret-at-least-32-chars";
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const [key, value] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: previous.url, SUPABASE_SERVICE_ROLE_KEY: previous.key, EMAIL_PREFERENCES_SECRET: previous.secret })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
async function token() { return new URL(await createUnsubscribeUrl(" Reader@Example.com ", "https://example.com/")).searchParams.get("token")!; }
function request(value: string) { return new NextRequest("http://localhost/api/newsletter/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: value }) }); }

test("signed preference links normalize the address and point to the confirmation page", async () => {
  assert.equal(await readUnsubscribeEmail(await token()), "reader@example.com");
  assert.equal(writes, 0);
});
test("tampered tokens and account-auth tokens cannot change email preferences", async () => {
  const valid = await token();
  const forged = `${valid.slice(0, -5)}AAAAA`;
  assert.equal((await POST(request(forged), undefined)).status, 400);
  const accountToken = await new SignJWT({ email: "reader@example.com" }).setProtectedHeader({ alg: "HS256" })
    .setIssuer("letty-backend").sign(new TextEncoder().encode(process.env.EMAIL_PREFERENCES_SECRET));
  await assert.rejects(readUnsubscribeEmail(accountToken));
  assert.equal(writes, 0);
});
test("confirmation persists an opt-out and optional emails stop, including repeated requests", async () => {
  assert.equal(await hasEmailSubscription("reader@example.com"), true);
  const value = await token();
  assert.equal((await POST(request(value), undefined)).status, 200);
  assert.equal(await hasEmailSubscription("reader@example.com"), false);
  assert.equal((await POST(request(value), undefined)).status, 200);
});
test("database errors never report a successful unsubscribe", async () => {
  unavailable = true;
  assert.equal((await POST(request(await token()), undefined)).status, 503);
  await assert.rejects(hasEmailSubscription("reader@example.com"));
  unavailable = false;
});
