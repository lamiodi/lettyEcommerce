# LETTY — Pre-Launch Audit & Remediation Tracker

> **Source:** external pre-launch audit report (received 2026-09-29), archived
> verbatim in Part B. **Part A** is the remediation tracker, re-verified against
> the repository on 2026-09-29 — several audit claims were already fixed in
> earlier hardening rounds or were stale, and this pass fixed the remainder
> that is code-side and non-checkout. Dashboard-only steps live in
> [`LAUNCH.md`](LAUNCH.md).

---

## Part A — Remediation Tracker (verified 2026-09-29)

| # | Audit finding | Severity | Status |
|---|---|---|---|
| 1 | Paystack gateway missing | CRITICAL | **Resolved by decision — Stripe-only, then scrubbed (2026-09-29).** Removed from `AGENT.MD`'s stack list and `Blueprint.md`'s plans; migration `024_stripe_only_gateway.sql` tightens the live `orders.payment_gateway` CHECK to `('stripe')` and drops the dead `paystack_publishable` app-settings key. Adapter code, if ever needed for NGN/GHS/ZAR/KES, stays archived in Part B §3. |
| 2a | `STRIPE_SECRET_KEY` + `DATABASE_URL` in `frontend/.env.local` | HIGH | **Fixed this pass** — removed from `frontend/.env.local` (verified unused by any frontend source/config). Only `NEXT_PUBLIC_*` vars remain. |
| 2b | Secrets in git history (`fa18591`, `a58f4bd`) | HIGH | **Manual** — rotate Supabase DB password, Stripe keys, Resend, Cloudinary per [`LAUNCH.md` §7](LAUNCH.md). Rotation is the fix; history scrub optional (repo is private). |
| 3 | `frontend/public/images/IMG_7446.PNG` untracked → 404 on Vercel | HIGH | **Fixed** — committed in `0157b0e` (together with `earn-points-popup.tsx`, `page.tsx`, `offer-popup.tsx`). Referenced by tracked `frontend/src/lib/images.ts:82`. |
| 4 | Zero admin accounts | HIGH | **Manual** — [`LAUNCH.md` §3](LAUNCH.md): `npm run db:create-admin -- …` from `backend/`. |
| 5 | `/api/jobs/order-expiry` unscheduled | HIGH | **Half-done** — `.github/workflows/order-expiry-sweep.yml` exists (every 15 min). **Manual:** add GitHub Actions secret `JOBS_SECRET_KEY` (same value as Render) and run the workflow once to verify ([`LAUNCH.md` §5](LAUNCH.md)). |
| 6 | Cart stepper unbounded by stock | MEDIUM | **Fixed this pass** — `CartLineItem` passes `max={line.variant.stockQuantity}`. Verified beforehand that the checkout page renders only `CartLineItemSkeleton` (not `CartLineItem`), so **no checkout-page change occurred**. |
| 7 | Dead files (email previews, one-off scripts) | LOW | **Fixed this pass** — deleted `backend/public/email-previews/` (5 dev-mock HTML files), `backend/scripts/check-db.ts`, `backend/scripts/test-inventory-fix.ts`, `backend/scripts/update-prices-rest.ts`. Kept `generate-email-previews.ts` (regenerates the previews on demand). All recoverable from git history. |
| 8a | Backend deps: `@upstash/qstash`, `@upstash/ratelimit`, `@upstash/redis` unused | LOW | **Fixed this pass** — uninstalled. Code already replaced by the in-process limiter/cache (`backend/lib/cache/redis.ts`); jobs auth via `JOBS_SECRET_KEY`. (Supersedes the Upstash line in `AGENT.MD`'s original stack plan.) |
| 8b | Backend dep: `algoliasearch` "0 references" | LOW | **Audit stale — KEPT.** `backend/lib/algolia.ts` imports it and the `algolia-reindex` job uses it. Remove only if search is formally dropped. |
| 8c | Backend `pg` / `@types/pg` only used by CLI scripts | LOW | **Fixed this pass** — moved to `devDependencies` (runtime uses supabase-js; `pg` is scripts-only). |
| 8d | Frontend `shadcn` in dependencies | LOW | **Fixed this pass** — moved to `devDependencies` (CLI tool, not runtime). |
| 9 | Frontend missing security headers | MEDIUM | **Fixed this pass** — `async headers()` added to `frontend/next.config.ts` (nosniff, SAMEORIGIN framing, referrer policy, HSTS). |
| 10 | Media weight ~31.4 MB (`/ima/` typo folder, .MOV files, un-optimized PNGs) | LOW | **Partially fixed 2026-09-29 (perf pass)** — the five heaviest page assets re-encoded to WebP with `sharp` (PNG photos 1.75–3.28 MB → 60–227 KB, ~11.4 MB → ~0.7 MB total; `IMG_6090` EXIF-rotated + capped at 1200w): the three department heroes, the offer-popup skincare tile, and the country-modal/VIP/ambassadors editorial. Sources deleted after every reference was updated (frontend pages, `images.ts`, two backend utility scripts, Blueprint). Still open: `.MOV`s → Cloudinary, `IMG_6270/6571` tiles, `ima/` folder consolidation. |
| 11 | Checklist items 1–10 (Part B §7) | — | Code-side items done above; dashboard/manual items are [`LAUNCH.md`](LAUNCH.md) §2, §3, §5, §7, §11. |

**Not changed (per owner instruction):** nothing under the checkout page
(`frontend/src/app/checkout/**`, `frontend/src/components/checkout/**`) was
modified in this pass. The only checkout-adjacent audit remedy (Paystack
adapter, Part B §3) is documentation-only.

---

## Part B — Original Audit Report (archived 2026-09-29)

> Archived verbatim except: the tool-activity preamble was dropped, and
> `file:///c:/Users/nuke/Documents/lettyECOMMERCE/…` links were rewritten
> repo-relative so they resolve in GitHub/editors. Line numbers reflect the
> tree at audit time and may have drifted.

# Pre-Launch E-Commerce Audit & Security Assessment

---

## 1. Executive Summary & Readiness Score

### System Architecture Overview
The **LETTY** luxury e-commerce platform is built as a split-architecture application:
- **Storefront & Admin UI (Frontend):** Next.js 15.5 (App Router with Turbopack), React 19, Zustand stores, Framer Motion, Lenis smooth scrolling, Tailwind CSS v4, and Base-UI primitives. Deployed to Vercel with automated path rewrites routing API traffic to the backend.
- **API & Transaction Service (Backend):** Next.js 15.5 Standalone Node.js service running on Render (`https://lettyecommerce.onrender.com`), backed by Supabase Postgres (`hjqylutputroxwmicdaq`, AWS eu-central-1), in-process rate limiting, Pino logging, and Resend transactional email.

---

### Overall Production Readiness Score: **62 / 100**

```
┌─────────────────────────────────────────────────────────────┬──────────┐
│ Audit Category                                              │ Score    │
├─────────────────────────────────────────────────────────────┼──────────┤
│ 1. Catalog, UI Aesthetics & Mobile Presentation             │ 92 / 100 │
│ 2. Cart Operations & Multi-Currency State Management        │ 88 / 100 │
│ 3. Checkout Data Integrity & Atomic Inventory Locking       │ 90 / 100 │
│ 4. Stripe Payment Pipeline (Init, Webhook, Verify, Sweeps)  │ 92 / 100 │
│ 5. Paystack Gateway Integration (Targeted by User)          │  0 / 100 │
│ 6. Environment, Secrets & Credential Hygiene                │ 42 / 100 │
│ 7. Static Assets, Bundle Weight & Dependency Hygiene        │ 60 / 100 │
├─────────────────────────────────────────────────────────────┼──────────┤
│ COMPOSITE PRE-LAUNCH READINESS SCORE                        │ 62 / 100 │
└─────────────────────────────────────────────────────────────┴──────────┘
```

> [!CAUTION]
> ### Primary Audit Finding: Paystack Gateway Discrepancy
> You stated in your prompt: *"I am currently using Paystack test keys (public test key on the frontend, secret test key on the server/backend) and need to ensure the system is completely functional, secure, and production-ready."*
>
> **The codebase currently has ZERO Paystack implementation.**
> - The application was originally planned for Dual Gateways ([`Blueprint.md`](Blueprint.md)) and the database schema supports it ([`003_orders.sql:122`](backend/supabase/migrations/003_orders.sql)), but the payment pipeline was built **exclusively for Stripe**.
> - The backend router ([`router.ts:7-11`](backend/lib/payments/router.ts)) hardcodes `return "stripe"`.
> - The verification endpoint ([`verify/route.ts:25-48`](backend/app/api/checkout/verify/route.ts)) calls `stripe().paymentIntents.retrieve(reference)`.
> - The frontend mounts Stripe Elements ([`checkout-content.tsx:7-75`](frontend/src/components/checkout/checkout-content.tsx)).
> - If you input Paystack keys (`pk_test_...`, `sk_test_...`) into your environment variables, the system will crash or reject all checkouts. Detailed remediation and integration code are provided in Section 3.

> **Tracker note (2026-09-29):** resolved by decision — the store runs Stripe-only.

---

## 2. Critical Blockers (Must Fix Before Going Live)

These 6 issues will cause payment failures, broken UI, stock desynchronization, or security compromises in production:

### 1. The Paystack Discrepancy (Severity: CRITICAL)
- **Problem:** If your merchant account or customer base requires Paystack (NGN cards, bank transfers, USSD, MoMo), checkouts cannot process. The backend validation schema [`checkoutVerifySchema`](backend/lib/validations/index.ts) only permits `gateway: z.enum(["stripe"])`. Any call with `gateway=paystack` produces an HTTP 400 rejection.
- **Impact:** Complete checkout blockage for African local payment methods.
- **Fix:** Either commit to Stripe (which supports international card processing in NGN/USD/GBP/EUR/CAD) or implement the Paystack adapter detailed in Section 3.

### 2. Leaked & Misplaced Sensitive Secrets (Severity: HIGH)
- **Problem:** In [`frontend/.env.local`](frontend/.env.local), the backend secret key `STRIPE_SECRET_KEY=rk_test_...` and direct PostgreSQL database connection string `DATABASE_URL=postgresql://postgres.hjqylutputroxwmicdaq:...@...` are stored inside the frontend root.
- **Git Exposure:** Both [`backend/.env`](backend/.env) and [`frontend/.env.local`](frontend/.env.local) secrets exist in git commit history (e.g., commit `fa18591` and `a58f4bd`).
- **Fix:** Immediately delete backend secrets from `frontend/.env.local`. Rotate the Supabase database password, Stripe keys, Resend API key, and Cloudinary secrets in their respective dashboards before switching to production traffic.

### 3. Untracked Production Asset Causing 404 on Vercel (Severity: HIGH)
- **Problem:** [`frontend/public/images/IMG_7446.PNG`](frontend/public/images/IMG_7446.PNG) (2.68 MB) is referenced in the homepage modal ([`offer-popup.tsx:143`](frontend/src/components/home/offer-popup.tsx)) and image registry ([`images.ts:82`](frontend/src/lib/images.ts)), but is **untracked in Git** (`git status` reports untracked).
- **Impact:** When deployed via Git push to Vercel, this image will not be packaged, causing broken 404 image icons on the welcome offer popup.
- **Fix:** Compress and commit the asset or migrate it to the Cloudinary CDN.

### 4. Zero Admin Accounts in Database (Severity: HIGH)
- **Problem:** The live Supabase table `admins` has **0 rows** ([`LAUNCH.md:13-18`](LAUNCH.md)).
- **Impact:** Store owners cannot log in at `/admin/login`. Admin actions (order fulfillment, tracking number updates, refunds, inventory restocking) are blocked.
- **Fix:** Run the bootstrap CLI command on the backend server:
  ```bash
  npm run db:create-admin -- owner@houseofletty.com "SecurePassword123!" "Owner Name"
  ```

### 5. Unscheduled Load-Bearing Sweeper (`/api/jobs/order-expiry`) (Severity: HIGH)
- **Problem:** Checkout initiation reserves physical inventory in PostgreSQL ([`orchestrator.ts:303-309`](backend/lib/orders/orchestrator.ts)). Shoppers who abandon their payment tab leave items in `reserved_quantity`. Without the cron job, inventory is permanently locked and variants show false "Out of Stock" badges.
- **Fix:** Ensure GitHub Actions secret `JOBS_SECRET_KEY` matches Render's `JOBS_SECRET_KEY` so [`.github/workflows/order-expiry-sweep.yml`](.github/workflows/order-expiry-sweep.yml) runs every 15 minutes.

### 6. Cart Stepper Unbounded by Real Inventory (Severity: MEDIUM)
- **Problem:** While the product page PDP ([`purchase-panel.tsx:311`](frontend/src/components/product/purchase-panel.tsx)) bounds the stepper by `variant.stockQuantity`, the cart line item ([`cart-line-item.tsx:66-70`](frontend/src/components/cart/cart-line-item.tsx)) omits `max`. The default `QuantityStepper` fallback allows shoppers to increase quantity up to 99 ([`quantity-stepper.tsx:22`](frontend/src/components/shared/quantity-stepper.tsx)).
- **Impact:** When the shopper clicks "Pay Now", the backend throws an unhandled `409 ConflictError: Insufficient stock`.
- **Fix:** Pass `max={line.variant.stockQuantity}` to `QuantityStepper` in `cart-line-item.tsx`.

---

## 3. Paystack vs. Stripe Payment Flow Audit

### Detailed Comparison Matrix

| Evaluation Criteria | Paystack Requirement (Targeted) | Current Codebase Implementation (Stripe) | Status |
|---|---|---|---|
| **Payment Gateway** | Paystack Standard / Inline API | Stripe Elements (`@stripe/stripe-js` v9.15) | ❌ Incompatible |
| **Transaction Init** | `POST https://api.paystack.co/transaction/initialize` | `stripe().paymentIntents.create(...)` in [`stripe.ts:40`](backend/lib/payments/stripe.ts) | ❌ Missing Paystack |
| **Amount Unit** | Lowest unit (Kobo for NGN, Pesewas for GHS: `Math.round(amount * 100)`) | Minor units via [`toMinorUnits`](backend/lib/utils/currency.ts) (Pence for GBP, Cents for USD/EUR) | ✅ Correct for Stripe |
| **Client Key Exposure** | Only `pk_test_...` or `pk_live_...` on client bundle | `pk_test_...` in frontend; **WARNING:** `STRIPE_SECRET_KEY` leaked in `frontend/.env.local:16` | ⚠️ High Risk |
| **Server Verification** | `GET https://api.paystack.co/transaction/verify/:reference` with Bearer auth | `stripe().paymentIntents.retrieve(reference)` in [`verify/route.ts:48`](backend/app/api/checkout/verify/route.ts) | ❌ Missing Paystack |
| **Webhook Signature** | Header `x-paystack-signature` validated with HMAC-SHA512 using secret key | Header `stripe-signature` validated via [`verifyStripeWebhook`](backend/lib/payments/stripe.ts) | ❌ Missing Paystack |
| **Idempotency** | Compare-and-set DB locks to prevent double-fulfillment | Implemented in [`markOrderPaid`](backend/lib/orders/orchestrator.ts) (`.neq("payment_status", "paid")`) | ✅ Best-in-class |
| **Failure Rollback** | Failed/abandoned transactions cancel intent and release stock | Implemented in [`markOrderFailed`](backend/lib/orders/orchestrator.ts) & [`order-expiry/route.ts:88`](backend/app/api/jobs/order-expiry/route.ts) | ✅ Fully Atomic |

---

### Step-by-Step Implementation: Adding Paystack Support

If you need Paystack to accept African payments (NGN, GHS, ZAR, KES), the following files must be added or updated:

#### 1. Paystack Service Utility: `backend/lib/payments/paystack.ts`
```typescript
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePaystackTransaction(params: {
  amount: number; // in major units (e.g. 5000 NGN)
  currency: string;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  if (!PAYSTACK_SECRET) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  // Paystack expects amount in lowest unit (kobo for NGN)
  const amountInKobo = Math.round(params.amount * 100);

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInKobo,
      currency: params.currency.toUpperCase(),
      email: params.email,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await res.json();
  if (!data.status) throw new Error(`Paystack init failed: ${data.message}`);
  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  if (!PAYSTACK_SECRET) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await res.json();
  if (!data.status) throw new Error(`Paystack verification failed: ${data.message}`);
  return data.data; // contains status: 'success', amount, currency, metadata
}

export function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  if (!PAYSTACK_SECRET) return false;
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
```

#### 2. Paystack Webhook Handler: `backend/app/api/checkout/webhook/paystack/route.ts`
```typescript
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { markOrderPaid, markOrderFailed } from "@/lib/orders/orchestrator";
import { executePostPayment } from "@/lib/orders/post-payment";

export const runtime = "nodejs";

export const POST = asyncHandler(async (req: NextRequest) => {
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();
  if (!verifyPaystackSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;
  const data = payload.data;

  if (event === "charge.success") {
    const reference = data.reference;
    await markOrderPaid(
      reference,
      { source: "paystack_webhook", id: data.id },
      {
        amountMinor: data.amount,
        currency: data.currency,
        livemode: data.domain === "live",
      }
    );
    await executePostPayment(reference, "paystack");
  } else if (event === "charge.failed") {
    await markOrderFailed(data.reference, data.gateway_response || "Payment failed");
  }

  return Response.json({ status: "success" });
});
```

#### 3. Update Verification Endpoint ([`backend/app/api/checkout/verify/route.ts`](backend/app/api/checkout/verify/route.ts))
Expand [`checkoutVerifySchema`](backend/lib/validations/index.ts) to `gateway: z.enum(["stripe", "paystack"])` and branch verification based on the selected gateway.

---

## 4. Redundant, Dead Code & Unused Files Inventory

A complete filesystem and static asset audit identified **31.4 MB of redundant or unoptimized files**:

```
Path                                                    Size        Category     Action / Rationale
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
frontend/public/ima/IMG_9428.MOV                        9.77 MB     Video Media  DELETE or stream from Cloudinary
frontend/public/IMG_9502.MOV                             4.17 MB     Video Media  DELETE or stream from Cloudinary
frontend/public/IMG_6534.PNG                            3.28 MB     Image Media  Convert to WebP (saves ~2.8MB)
frontend/public/images/IMG_7446.PNG                     2.68 MB     Image Media  Untracked in git; commit or CDN
frontend/public/IMG_6270.PNG                            1.95 MB     Image Media  Convert to WebP (saves ~1.6MB)
frontend/public/IMG_6543.PNG                            1.87 MB     Image Media  Convert to WebP (saves ~1.5MB)
frontend/public/IMG_6571.PNG                            1.79 MB     Image Media  Convert to WebP (saves ~1.4MB)
frontend/public/IMG_6549.PNG                            1.75 MB     Image Media  Convert to WebP (saves ~1.4MB)
frontend/public/ima/IMG_6090.JPG.jpeg                   1.72 MB     Image Media  Duplicate extension; optimize
frontend/public/IMG_6572.MOV                             1.36 MB     Video Media  DELETE or stream from Cloudinary
frontend/public/IMG_5725.MOV                            0.96 MB     Video Media  DELETE or stream from Cloudinary
frontend/public/ima/                                    Folder      Directory    Misnamed folder; consolidate
backend/public/email-previews/preview-*.html (5 files)  79.6 KB     Dev Mock     DELETE (Development previews only)
backend/scripts/generate-email-previews.ts              4.1 KB       Dev Tool     Can be archived or moved to tools/
backend/scripts/test-inventory-fix.ts                   5.5 KB       Dev Test     DELETE (One-off testing script)
backend/scripts/update-prices-rest.ts                   1.9 KB       Dev Script   DELETE (One-off pricing migration)
backend/scripts/check-db.ts                              0.9 KB       Dev Script   DELETE (One-off connectivity probe)
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
TOTAL REDUNDANCY / POTENTIAL SAVINGS:                   ~31.4 MB
```

### Key Media Observations:
1. **Misnamed Directory (`frontend/public/ima`):** Contains `stripe_logo.png`, `IMG_6090.JPG.jpeg`, `IMG_7017.JPG (1).jpeg`, and `IMG_9428.MOV`. This was created as a truncated typo for `images`. Files have duplicate extensions (`.JPG.jpeg`) and spaces in filenames (`(1).jpeg`). Consolidate into `frontend/public/images/brand/` and `frontend/public/images/ugc/`.
2. **Heavy `.MOV` Videos in Public Web Root:** Videos like `IMG_9428.MOV` (9.77 MB) and `IMG_9502.MOV` (4.17 MB) are QuickTime Apple files that do not stream efficiently on Android or Windows browsers. Upload them to Cloudinary (which is already connected: `jtsxpm1l`) to automatically serve optimized H.264 / WebM streams.

---

## 5. Unused Dependencies & Optimization Recommendations

### Backend (`backend/package.json`)

```
Dependency            Installed Version   Usage in Codebase   Recommendation
──────────────────────────────────────────────────────────────────────────────────────────────────────────
@upstash/qstash       ^2.7.20             0 references        REMOVE — Replaced by internal jobs auth
@upstash/ratelimit    ^2.0.5              0 references        REMOVE — Replaced by in-process sliding window
@upstash/redis        ^1.34.3             0 references        REMOVE — In-process memory store now used
algoliasearch         ^5.20.0             Unconfigured keys   REMOVE or configure credentials
pg & @types/pg        ^8.23.0             Only in CLI scripts Move to devDependencies
```

**Actions for `backend/package.json`:**
```bash
npm uninstall @upstash/qstash @upstash/ratelimit @upstash/redis algoliasearch
npm install -D pg @types/pg
```

> **Tracker note (2026-09-29):** `algoliasearch` is referenced by `backend/lib/algolia.ts`
> and the `algolia-reindex` job — it was **kept**. Everything else was applied.

### Frontend (`frontend/package.json`)

```
Dependency            Installed Version   Usage in Codebase   Recommendation
──────────────────────────────────────────────────────────────────────────────────────────────────────────
shadcn                ^4.14.0             CLI tool            Move to devDependencies or remove (use npx)
@stripe/stripe-js     ^9.15.0             Checkout Elements   Keep if using Stripe; swap if Paystack only
tw-animate-css        ^1.4.0              globals.css         Keep (lightweight animation utility)
```

**Actions for `frontend/package.json`:**
```bash
npm uninstall shadcn
npm install -D shadcn
```

---

## 6. End-to-End Functional & Security Audit

### 1. Product Catalog & Image Rendering
- **Variants & PDP Synching:** [ProductStage](frontend/src/components/product/product-stage.tsx) seamlessly filters shades and sizes based on URL query parameters (`?shade=` or `?color=`). Selecting a shade isolates that specific shade's media gallery ([`product-stage.tsx:73-100`](frontend/src/components/product/product-stage.tsx)), preventing shade mismatching.
- **Price Calculations:** Multi-currency calculations are cleanly executed through [`useCurrencyStore`](frontend/src/lib/store/currency.ts) and backed by Frankfurter ECB live FX rates in [`fx.ts`](backend/lib/currency/fx.ts). NGN and KES round cleanly to integers, while USD, GBP, EUR, CAD round to 2 decimals.

### 2. Cart & Inventory Operations
- **State Persistence:** Cart lines persist across browser reloads via Zustand `persist` in `localStorage` under `letty-cart` ([`cart.ts:54`](frontend/src/lib/store/cart.ts)).
- **Rehydration Sanitization:** [Cart store](frontend/src/lib/store/cart.ts) verifies stored product slugs upon rehydration, pruning deleted or corrupted entries.
- **Stock Validation:** Server-side validation in [`priceCart`](backend/lib/cart/pricing.ts) checks `v.stock_quantity < cartItem.quantity` before creating orders. Physical reservations are acquired atomically using PostgreSQL row locks in RPC `reserve_inventory` ([`006_rpc_functions.sql`](backend/supabase/migrations/006_rpc_functions.sql)).

### 3. Customer Data & Checkout Forms
- **Input Sanitization:** Customer email is checked with strict RFC-compliant Zod validation ([`validations/index.ts:12`](backend/lib/validations/index.ts)).
- **Guest vs. Logged-in Flow:** Checkout does not mandate account creation. Guests can purchase directly; the backend automatically creates or associates a customer profile using an atomic `upsert` on email ([`orchestrator.ts:122-135`](backend/lib/orders/orchestrator.ts)).
- **Address Validation:** Shipping and billing inputs are validated with country code transformations ([`ISO_COUNTRY`](backend/lib/validations/index.ts)), handling full country names like "United Kingdom" and standardizing to `"GB"`.

### 4. HTTP Security & Headers Audit
- **Backend Headers:** [`backend/next.config.mjs:12-27`](backend/next.config.mjs) applies `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Frontend Missing Security Headers:** [`frontend/next.config.ts`](frontend/next.config.ts) does **not** configure HTTP security headers. Add the following to `frontend/next.config.ts`:
  ```typescript
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  }
  ```

> **Tracker note (2026-09-29):** applied.

---

## 7. Step-by-Step Pre-Launch Action Checklist

Complete these 10 actionable steps before switching keys to live:

```markdown
- [ ] 1. GATEWAY CLARIFICATION
      [ ] Confirm whether to launch with Stripe (supports cards globally) or implement the Paystack code provided in Section 3 for African payment methods.

- [ ] 2. ROTATE LEAKED CREDENTIALS
      [ ] Supabase: Reset database password in Supabase Dashboard → Settings → Database.
      [ ] Resend: Generate a new API key in Resend Dashboard and update Render.
      [ ] Cloudinary: Rotate API secret in Cloudinary Settings → Access Keys.
      [ ] Stripe / Paystack: Generate new restricted live keys.

- [ ] 3. CLEAN FRONTEND SECRETS
      [ ] Open frontend/.env.local and remove STRIPE_SECRET_KEY and DATABASE_URL.
      [ ] Ensure only NEXT_PUBLIC_ variables reside in frontend deployment environments.

- [ ] 4. TRACK MISSING STATIC ASSETS
      [ ] Run: git add frontend/public/images/IMG_7446.PNG
      [ ] Commit and push so Vercel does not 404 on the homepage offer modal.

- [ ] 5. INITIALIZE PRODUCTION ADMIN
      [ ] Run on backend: npm run db:create-admin -- owner@houseofletty.com "SecurePassword!" "Maison Owner"
      [ ] Verify sign-in at https://www.houseofletty.com/admin/login.

- [ ] 6. WIRE UP ORDER EXPIRY SWEEP
      [ ] Copy JOBS_SECRET_KEY from Render Environment variables.
      [ ] Go to GitHub Repo → Settings → Secrets and variables → Actions.
      [ ] Add secret JOBS_SECRET_KEY so the 15-minute order expiry sweep can run.

- [ ] 7. REGISTER WEBHOOKS IN PAYMENT DASHBOARDS
      [ ] Stripe: Register https://lettyecommerce.onrender.com/api/checkout/webhook/stripe
          Events: payment_intent.succeeded, payment_intent.payment_failed, charge.dispute.created
          Copy secret (whsec_...) to STRIPE_WEBHOOK_SECRET on Render.
      [ ] Paystack (if enabled): Register https://lettyecommerce.onrender.com/api/checkout/webhook/paystack

- [ ] 8. CONFIGURE FRONTEND SECURITY HEADERS
      [ ] Add Strict-Transport-Security (HSTS) and X-Frame-Options to frontend/next.config.ts.

- [ ] 9. FIX CART STEPPER INVENTORY BOUND
      [ ] In frontend/src/components/cart/cart-line-item.tsx, pass max={line.variant.stockQuantity} to QuantityStepper.

- [ ] 10. SMOKE TEST IN LIVE MODE
      [ ] Place a live test order with a real credit card (£9.00 Lip Liner).
      [ ] Verify order record in /admin/orders.
      [ ] Verify stock decrement in /api/public/inventory.
      [ ] Issue refund directly from the Stripe/Paystack dashboard and confirm cancellation event.
```

> **Tracker note (2026-09-29):** items 1, 3, 4, 8, 9 are done (Part A).
> Items 2, 5, 6, 7, 10 are manual dashboard steps — see [`LAUNCH.md`](LAUNCH.md).
