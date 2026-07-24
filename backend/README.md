# LETTY — Backend

A standalone, production-ready Next.js 15 backend for the **LETTY** luxury
e-commerce platform. Owns the database, payments, search, jobs, and admin
APIs. The frontend lives in `../frontend` and consumes this service over
HTTP.

> Built strictly against the [Ultimate Enterprise Blueprint (v3)](../Blueprint.md).

---

## Highlights

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict).
- **Supabase / PostgreSQL** with a fully normalized schema, RLS, and atomic RPC functions.
- **Stripe** (international) + **Paystack** (Africa) with currency-based gateway routing.
- **Algolia** full-text search with server-side reindexing.
- **Resend + React Email** transactional templates (order, shipping, cart, welcome).
- **Upstash Redis** for rate limiting and KV caching.
- **Vercel QStash** for async jobs (post-payment, abandoned cart, inventory sync, reindex).
- **Edge middleware** for CORS, JWT-gated admin routes, and coarse rate limiting.
- **RBAC** with 7 staff roles (`owner`, `admin`, `manager`, `inventory`,
  `support`, `marketing`, `editor`) and 12 fine-grained permissions.
- **Server Actions** for admin mutations (products, orders, inventory, CMS, coupons, settings, reviews, admins).
- **Webhook handlers** for Stripe and Paystack with signature verification.
- **Inventory ledger** with `RESTOCK`, `SALE`, `RETURN`, `ADJUSTMENT`, `RESERVATION_RELEASE` reasons.
- **Coupons & Gift Cards** with first-class `apply_coupon` and `debitGiftCard` flows.
- **Structured logging** via `pino` (Edge-safe fallback).
- **Strict Zod validation** on every public input.

---

## Quick start

```bash
cd backend
cp .env.example .env.local       # fill in real values
npm install
npm run typecheck
npm run dev                       # starts on :4000
```

> The first time you point the service at a fresh Supabase project, run the
> migrations and seed against it:
>
> ```bash
> npm run db:migrate
> ```

For production:

```bash
npm run build
npm start
```

---

## Project layout

```
backend/
├── app/
│   ├── admin/actions/         # Server Actions (auth, products, orders, inventory, cms, coupons, settings, reviews, admins)
│   ├── api/
│   │   ├── admin/             # Admin REST endpoints (login, me, orders, customers, products, analytics, notifications)
│   │   ├── cart/validate      # Pre-checkout pricing
│   │   ├── checkout/          # init, verify, webhooks (stripe, paystack)
│   │   ├── coupon/validate    # Public coupon validation
│   │   ├── customer/          # orders, reviews, wishlist
│   │   ├── giftcard/validate  # Public gift card validation
│   │   ├── jobs/              # post-payment, abandoned-cart, inventory-sync, algolia-reindex
│   │   ├── newsletter
│   │   ├── public/            # products, categories, brands, collections, cms, search, reviews
│   │   └── waitlist
│   ├── health/                # GET /api/health
│   └── layout.tsx             # Minimal Next.js root layout (no UI)
├── lib/
│   ├── algolia.ts             # Index settings + sync helpers
│   ├── auth/rbac.ts           # JWT + permissions
│   ├── cache/redis.ts         # Upstash Redis + rate limiters
│   ├── cart/pricing.ts        # Cart valuation
│   ├── coupons/manager.ts
│   ├── cors.ts
│   ├── db/types.ts            # DB row types
│   ├── email/                 # Resend + brand-styled templates
│   ├── env.ts                 # Validated env access
│   ├── errors.ts              # AppError + apiError()
│   ├── giftcards/manager.ts
│   ├── handler.ts             # asyncHandler + safeAction()
│   ├── inventory/manager.ts
│   ├── logger.ts              # Pino + Edge fallback
│   ├── orders/orchestrator.ts # End-to-end order pipeline
│   ├── payments/
│   │   ├── paystack.ts
│   │   ├── router.ts          # Currency → gateway selection
│   │   └── stripe.ts
│   ├── queue/qstash.ts        # Publish + verify
│   ├── responses.ts           # ok / created / paginated
│   ├── shipping/calculator.ts
│   ├── supabase/server.ts     # server / admin / browser clients
│   ├── tax/calculator.ts
│   ├── utils/                 # currency, slug
│   └── validations/index.ts   # All Zod schemas
├── middleware.ts              # CORS, admin gate, preflight
├── scripts/migrate.ts         # Apply SQL migrations
├── supabase/
│   ├── migrations/            # 000 → 006
│   └── seed.sql
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Bypasses RLS — never expose. |
| `JWT_SECRET_KEY` | yes | 32+ chars. Used for `admin_token` JWTs. |
| `STRIPE_SECRET_KEY` | for Stripe | |
| `STRIPE_WEBHOOK_SECRET` | for webhooks | |
| `STRIPE_PUBLISHABLE_KEY` | optional | |
| `PAYSTACK_SECRET_KEY` | for Paystack | |
| `PAYSTACK_PUBLIC_KEY` | optional | |
| `ALGOLIA_APP_ID` / `ALGOLIA_ADMIN_KEY` / `ALGOLIA_SEARCH_KEY` | for search | |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | for rate limit + cache | |
| `QSTASH_TOKEN` / `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | for jobs | |
| `RESEND_API_KEY` | for emails | |
| `EMAIL_FROM` | yes | e.g. `LETTY <orders@letty.com>` |
| `FRONTEND_ORIGINS` | yes | Comma-separated CORS allow-list. |
| `NEXT_PUBLIC_SITE_URL` | yes | Used for absolute URLs in emails. |
| `LOG_LEVEL` | optional | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `SENTRY_DSN` | optional | Hook for your error reporter. |

---

## Database

### Apply migrations

Migrations live in `supabase/migrations/` and are applied in lexicographic
order. The default `npm run db:migrate` script will try to call a server-side
`exec_sql` RPC; if your Supabase project does not expose one, run the
migrations through the Supabase SQL editor (or `supabase db push` from the
Supabase CLI).

```bash
# Option A — via Supabase CLI (recommended)
supabase db push --db-url "$SUPABASE_DB_URL"

# Option B — paste each file into the Supabase SQL editor
```

### Schema overview

| Domain | Tables |
| --- | --- |
| Identity | `admins`, `audit_logs`, `admin_notifications` |
| Customers | `customers`, `addresses` |
| Catalog | `brands`, `categories`, `collections`, `collection_products`, `products`, `product_media`, `product_variants`, `variant_options` |
| Inventory | `inventory_transactions`, `wishlists`, `reviews`, `waitlist` |
| Commerce | `shipping_zones`, `shipping_methods`, `tax_rules`, `returns`, `orders`, `order_items`, `order_events`, `coupons`, `gift_cards`, `gift_card_transactions` |
| Content | `cms_sections`, `daily_metrics`, `abandoned_carts`, `newsletter_subscribers`, `settings` |

### RPC functions

| Function | Purpose |
| --- | --- |
| `reserve_inventory(p_order_id, p_items)` | Atomic stock decrement + ledger entry. |
| `commit_inventory(p_reference)` | Release reservation after payment. |
| `release_inventory(p_order_id)` | Cancel/timeout: returns stock. |
| `restock_variant(p_variant_id, p_quantity, p_admin_id, p_notes)` | Admin restock helper. |
| `apply_coupon(p_code, p_subtotal, p_customer_id)` | Validates + computes discount. |
| `increment_coupon_usage(p_coupon_id)` | Counter for analytics / limits. |
| `record_daily_metric(...)` | UPSERT for the daily metrics rollup. |
| `generate_order_number()` | LETTY-{YYYYMMDD}-{6hex} |

### Row Level Security

All public, customer, and admin tables have RLS enabled. The strategy:

- **Public read** on `products`, `product_variants`, `product_media`,
  `variant_options`, `brands`, `categories`, `collections`,
  `collection_products`, `reviews` (approved), `cms_sections` (active),
  `shipping_zones` (active), `shipping_methods` (active), `tax_rules`,
  `coupons` (active).
- **Public insert** on `orders`, `order_items`, `abandoned_carts`,
  `waitlist`, `newsletter_subscribers`.
- **No public access** on `customers`, `addresses`, `admins`, `audit_logs`,
  `admin_notifications`, `inventory_transactions`, `returns`,
  `daily_metrics`, `settings`, `gift_cards`.
- Server-side writes go through the **service role** key, which bypasses
  RLS. Validation lives in the API layer, not RLS.

---

## API surface

All endpoints return a uniform envelope:

```json
{ "data": { ... } }
```

Errors:

```json
{ "error": "Human message", "code": "validation_error", "details": { ... } }
```

### Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness probe. |

### Public catalog

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/public/products` | Paginated listing + filters (`category`, `brand`, `collection`, `minPrice`, `maxPrice`, `inStock`, `sort`, `q`). |
| GET | `/api/public/products/[slug]` | Full product detail (variants, media, reviews). |
| GET | `/api/public/categories` | Active categories. |
| GET | `/api/public/brands` | Active brands. |
| GET | `/api/public/collections` | Active collections. |
| GET | `/api/public/collections/[slug]` | Collection + products. |
| GET | `/api/public/cms/[page]` | CMS sections for a page (`home`, `shop`, `product`, `collection`, `about`, `checkout_success`). |
| GET | `/api/public/search` | Algolia full-text search (`?q=...&type=products\|collections\|brands`). |
| GET | `/api/public/reviews` | Approved reviews for a product (`?product_id=...`). |

### Cart & checkout

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/cart/validate` | Price the cart, list shipping options. |
| POST | `/api/checkout/init` | Reserve stock, persist order, initialize gateway. |
| GET  | `/api/checkout/verify` | Verify with the gateway (Stripe or Paystack) and mark the order paid. |
| POST | `/api/checkout/webhook/stripe` | Stripe webhook (signature verified). |
| POST | `/api/checkout/webhook/paystack` | Paystack webhook (HMAC verified). |

### Customer

| Method | Path | Description |
| --- | --- | --- |
| GET  | `/api/customer/orders?email=&order_number=` | Guest order lookup. |
| POST | `/api/customer/orders` | Same as above, JSON body. |
| POST | `/api/customer/reviews` | Submit a review (verified if order details provided). |
| POST | `/api/customer/wishlist` | `{ email, product_id, action: "add" \| "remove" }` |
| POST | `/api/waitlist` | `{ email, variant_id }` |
| POST | `/api/newsletter` | `{ email, source? }` |
| POST | `/api/coupon/validate` | `{ code, subtotal, currency, customerId? }` |
| POST | `/api/giftcard/validate` | `{ code, currency }` |

### Admin (cookie auth: `admin_token`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/admin/login` | Sets `admin_token` cookie. |
| POST | `/api/admin/logout` | Clears the cookie. |
| GET  | `/api/admin/me` | Current admin. |
| GET  | `/api/admin/orders` | Paginated list with filters. |
| GET  | `/api/admin/orders/[id]` | Full order with events, items, addresses. |
| GET  | `/api/admin/customers` | Paginated customer search. |
| GET  | `/api/admin/products` | Paginated product search. |
| GET  | `/api/admin/analytics` | KPI rollup. |
| GET  | `/api/admin/notifications` | Unread admin notifications. |

### Jobs (QStash-signed)

| Method | Path | Trigger |
| --- | --- | --- |
| POST | `/api/jobs/post-payment` | After `payment_intent.succeeded` / `charge.success`. |
| POST | `/api/jobs/abandoned-cart` | Hourly cron. |
| POST | `/api/jobs/inventory-sync` | Hourly cron. |
| POST | `/api/jobs/algolia-reindex` | Manual reindex. |

---

## Server Actions

Use these from the (future) admin UI in the **frontend** project — they
require a session cookie obtained from `/api/admin/login`.

| Action | Path | Description |
| --- | --- | --- |
| `adminLoginAction` | `app/admin/actions/auth.ts` | Form-action login. |
| `adminLogoutAction` | `app/admin/actions/auth.ts` | Clears session. |
| `createProductAction`, `updateProductAction`, `softDeleteProductAction`, `hardDeleteProductAction`, `toggleProductActiveAction` | `app/admin/actions/products.ts` | Product CRUD. |
| `createVariantAction`, `updateVariantAction` | `app/admin/actions/products.ts` | Variant CRUD. |
| `addProductMediaAction`, `removeProductMediaAction` | `app/admin/actions/products.ts` | Media management. |
| `updateFulfillmentAction`, `markShippedAction`, `setInternalNoteAction`, `refundOrderAction` | `app/admin/actions/orders.ts` | Order operations. |
| `restockVariantAction`, `adjustInventoryAction` | `app/admin/actions/inventory.ts` | Stock changes. |
| `createCmsSectionAction`, `updateCmsSectionAction`, `deleteCmsSectionAction` | `app/admin/actions/cms.ts` | CMS. |
| `createCouponAction`, `updateCouponAction`, `disableCouponAction` | `app/admin/actions/coupons.ts` | Coupons. |
| `upsertSettingAction` | `app/admin/actions/settings.ts` | Settings. |
| `approveReviewAction`, `rejectReviewAction` | `app/admin/actions/reviews.ts` | Moderation. |
| `createAdminAction`, `updateAdminRoleAction` | `app/admin/actions/admins.ts` | Owner only. |

---

## Order lifecycle

```
POST /api/checkout/init
   │ 1. priceCart  (load variants, tax, currency)
   │ 2. calculateShipping
   │ 3. validateCoupon (optional)
   │ 4. validateGiftCard (optional)
   │ 5. upsert customer + insert address
   │ 6. INSERT orders (status=pending) + INSERT order_items
   │ 7. RPC reserve_inventory (atomic)
   │ 8. INSERT order_events('placed')
   │ 9. debitGiftCard (if used)
   │ 10. Initialize gateway (Stripe or Paystack)
   ▼
   { order_id, order_number, gateway, client_secret | authorization_url }

Payment success → gateway webhook or /api/checkout/verify
   │
   │ 1. markOrderPaid (UPDATE payment_status='paid')
   │ 2. publish /api/jobs/post-payment (QStash)
   ▼
   Background job:
   │ 1. RPC commit_inventory
   │ 2. record_daily_metric
   │ 3. send order confirmation email (Resend)
   │ 4. redeem coupon (increment usage)
   │ 5. partialUpdateProduct on Algolia
   │ 6. insert admin_notifications('new_order')
   │ 7. insert audit_logs('POST_PAYMENT')
```

---

## Security notes

- All inputs are validated with Zod before any DB or gateway call.
- The Stripe webhook handler re-verifies the signature with `STRIPE_WEBHOOK_SECRET`.
- The Paystack webhook handler uses a constant-time HMAC SHA-512 compare.
- All admin endpoints require a valid `admin_token` JWT (HS256, `letty-backend` issuer).
- RBAC is enforced in **both** the API handlers (`checkPermission()`) **and** server actions.
- Service role key is only used in server-side code; never sent to clients.
- Rate limiting is per-IP for public and auth endpoints.
- Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

---

## Local webhook testing

```bash
# Stripe
stripe listen --forward-to localhost:4000/api/checkout/webhook/stripe

# QStash (optional)
npx qstash-cli dev
```

---

## License

Internal — LETTY © 2026.
