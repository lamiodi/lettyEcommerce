import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { before, after, test } from "node:test";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { POST as register } from "../app/api/customer/auth/register/route";
import { POST as reset } from "../app/api/customer/auth/reset-password/route";
import { customerPasswordVersion, isCustomerSessionCurrent, signCustomerToken, verifyCustomerToken } from "../lib/auth/customer";
import { isAuthorizedJobCall } from "../lib/queue/jobs-auth";

const oldEnv = { ...process.env };
const originalFetch = globalThis.fetch;
let passwordHash: string | null = null;
let active = true;
let guestExists = true;
let consumed = false;
let passwordWrites = 0;
let mails = 0;
let adminRole = "support";
let adminActive = true;
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let raw = ""; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : null;
  const path = req.url?.split("?")[0] ?? "";
  if (path.endsWith("/customers") && req.method === "GET") {
    res.end(JSON.stringify(guestExists ? { id: "customer-1", email: "reader@example.com", first_name: "Reader", is_active: active, password_hash: passwordHash } : null));
  } else if (path.endsWith("/customers") && req.method === "POST") {
    assert.equal(body.password_hash, null); assert.equal(body.marketing_consent, false);
    guestExists = true; res.statusCode = 201; res.end(JSON.stringify({ id: "customer-1" }));
  } else if (path.endsWith("/password_reset_tokens") && req.method === "POST") {
    assert.match(body.token_hash, /^[a-f0-9]{64}$/); assert.ok(Date.parse(body.expires_at) > Date.now());
    res.statusCode = 201; res.end();
  } else if (path.endsWith("/password_reset_tokens") && req.method === "GET") {
    // Both requests can read the same unused token. Only the atomic burn may win.
    res.end(JSON.stringify({ id: "token-1", customer_id: "customer-1", expires_at: new Date(Date.now()+60_000).toISOString(), used_at: null }));
  } else if (path.endsWith("/password_reset_tokens") && req.method === "PATCH") {
    if (consumed) res.end("null"); else { consumed = true; res.end(JSON.stringify({ id: "token-1" })); }
  } else if (path.endsWith("/customers") && req.method === "PATCH") {
    passwordWrites++; passwordHash = body.password_hash; res.statusCode = 204; res.end();
  } else if (path.endsWith("/admins")) {
    res.end(JSON.stringify({ is_active: adminActive, role: adminRole }));
  } else { res.statusCode = 500; res.end(JSON.stringify({ message: "Unexpected mock request" })); }
});
before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key";
  process.env.JWT_SECRET_KEY = "local-test-secret-that-is-long-enough";
  process.env.JOBS_SECRET_KEY = "local-job-secret";
  process.env.RESEND_API_KEY = "re_local_mock_only";
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.hostname === "api.resend.com") { mails++; return new Response(JSON.stringify({ id: `mock-${mails}` }), { status: 200, headers: { "Content-Type": "application/json" } }); }
    assert.equal(url.hostname, "127.0.0.1", "Tests cannot call any real external service");
    return originalFetch(input, init);
  };
});
after(async () => {
  globalThis.fetch = originalFetch; server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET_KEY", "JOBS_SECRET_KEY", "RESEND_API_KEY"]) {
    if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key];
  }
});
let requestIndex = 1;
function request(path: string, body: unknown) { return new NextRequest(`http://localhost/api/customer/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `192.0.2.${requestIndex++}` }, body: JSON.stringify(body) }); }

test("registering a guest email sends ownership proof without setting a password or issuing a session", async () => {
  const result = await register(request("register", { email: "Reader@example.com", password: "attacker-input", marketingConsent: true }), undefined);
  assert.equal(result.status, 201);
  assert.equal((await result.json()).data.requiresVerification, true);
  assert.equal(result.headers.get("set-cookie"), null);
  assert.equal(passwordWrites, 0); assert.equal(passwordHash, null); assert.equal(mails, 1);
});
test("a new signup is pending until the owner follows the secure email link", async () => {
  guestExists = false;
  const result = await register(request("register", { email: "reader@example.com", firstName: "Reader" }), undefined);
  assert.equal(result.status, 201); assert.equal(passwordHash, null); assert.equal(passwordWrites, 0);
});
test("two concurrent resets cannot consume the same token twice", async () => {
  consumed = false;
  const results = await Promise.all([reset(request("reset-password", { token: "local-single-use-token", password: "new-secure-password" }), undefined), reset(request("reset-password", { token: "local-single-use-token", password: "other-secure-password" }), undefined)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
  assert.equal(passwordWrites, 1);
});
test("password changes and deactivation invalidate existing customer sessions", async () => {
  const version = await customerPasswordVersion(passwordHash!);
  const claims = await verifyCustomerToken(await signCustomerToken({ id: "customer-1", email: "reader@example.com", passwordVersion: version }));
  assert.ok(claims); assert.equal(await isCustomerSessionCurrent(claims), true);
  passwordHash = "a-different-password-hash";
  assert.equal(await isCustomerSessionCurrent(claims), false);
  active = false; assert.equal(await isCustomerSessionCurrent(claims), false); active = true;
});
test("customer tokens and inactive or low-privilege admins cannot run background jobs", async () => {
  const makeToken = (issuer: string) => new SignJWT({ role: "owner" }).setProtectedHeader({ alg: "HS256" }).setSubject("admin-1").setIssuer(issuer).sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY));
  const job = (token: string) => new NextRequest("http://localhost/api/jobs/email-retry", { method: "POST", headers: { cookie: `admin_token=${token}` } });
  assert.equal(await isAuthorizedJobCall(job(await makeToken("letty-customer"))), false);
  const token = await makeToken("letty-backend");
  assert.equal(await isAuthorizedJobCall(job(token)), false);
  adminRole = "owner"; adminActive = false;
  assert.equal(await isAuthorizedJobCall(job(token)), false);
  adminActive = true; assert.equal(await isAuthorizedJobCall(job(token)), true);
});
