# LETTY launch-readiness audit

Date: 19 October 2026. Result: **NOT LAUNCH-READY**. Critical configuration and end-to-end checks remain unverified.

This audit covers the current working tree. Existing changes were preserved. No deployment, commit, push, Stripe key change, payment, real order, customer email or database migration was performed. Database inspection was read-only and limited to schema availability and product catalog records. Email tests intercepted delivery or used mocks.

## Status by area

| Area | Status | Result |
| --- | --- | --- |
| Public-page wording and literal links | Fixed | Removed remaining unsupported reply deadlines, commission and packaging promises. Updated global search/social metadata to the current beauty products. Approved About and Story content was retained. |
| Fresh mobile and desktop visual review | Not Tested | Browser automation initially timed out. When discovery recovered, the browser security policy blocked binding to the tab, so no workaround was attempted. Overlaps, horizontal scrolling, keyboard interaction and touch controls still need a working-browser pass. HTTP verification is recorded separately below. |
| Product names and GBP prices | Verified | Configured database returned liner GBP 9, gloss GBP 12 and Lash Book Kit GBP 12, matching storefront prices. Lash Book Kit is not marked as a preorder in the storefront. Product names and variant IDs match the configured catalog; the source label for liner shade 07 was corrected to Nightfall, matching the database, admin selector and image folder. Production deployment values were not independently verified. |
| mwah preorder | Blocked | Source has GBP 17, Ivory/Noir, 10 ml, manufacturer-confirmed SPF 15 and estimated dispatch late October to early November 2026. The product was absent from the configured database. No allocation quantities were supplied or invented. |
| Product and order images | Fixed | Video cards now derive prices/names from the catalog, and an explicitly empty or unpublished video list does not show a default carousel. Corrected the seventh liner image path to the existing IMG_6632.PNG asset. Missing order images now show a neutral package icon instead of a different product image. |
| Cart validation and quantities | Fixed | Invalid or stale product/variant pairs are discarded without changing shades. Persisted quantities must be positive integers, duplicate variants merge, quantities cap at 99 and carts at 50 lines. Malformed stored carts are normalized. |
| Availability | Fixed | Available stock subtracts reserved units; inactive products are excluded from the public inventory feed. Unconfirmed stock becomes zero instead of static catalog stock. Last-known inventory is bounded to five minutes during a backend outage. Checkout remains the final authority for stock. |
| Wishlist persistence, shipping, discounts and currencies | Not Tested | Source paths inspected; no browser persistence or complete shipping/coupon/FX transaction was verified. These need runtime checks, including country changes and cart totals. |
| Account creation and password reset | Fixed | Account setup now requires proof of email ownership before a password/session is issued. Reset tokens are consumed atomically; password changes and disabled accounts invalidate older customer sessions. Legacy sessions will require sign-in again. |
| Form validation | Verified | Validation-only tests cover missing account email, malformed newsletter email, blank contact messages and missing/unsafe restock identifiers. These tests prohibit external service calls. Successful submissions and inbox delivery remain unverified. |
| Guest order tracking | Fixed | Guest responses omit addresses, phone numbers, customer profiles and internal event notes. The client now submits lookup credentials in a POST body and has a timeout/duplicate guard. Account pages are no-index and do not send referrer details. Email plus an order number still grants access to order progress; this is not email ownership verification. |
| Admin and job permissions | Fixed | Permission checks use the current active admin and role. Background jobs require an appropriate active admin or the configured job secret in production. Admin cookies use SameSite Lax, and admin write requests receive an origin check. Full admin browser/role testing remains unverified. |
| Confirmation and preorder email logic | Verified | Mock checks cover paid-order guards, preorder wording, durable delivery leases, retry behavior and duplicate prevention. Unpaid orders must not receive paid-order confirmations. This is code-level verification, not a Stripe webhook or inbox-delivery pass. |
| Email infrastructure and scheduler | Blocked | The configured database returns PGRST205 for email_outbox. The local JOBS_SECRET_KEY is missing. Production/GitHub scheduler secrets, scheduled execution and provider delivery have not been verified. |
| Consent and unsubscribe | Verified | Mock tests cover signed unsubscribe links and suppression of optional campaigns. Newsletter signup uses conditional writes to limit duplicate welcome sends. Real resubscribe/unsubscribe delivery and provider handling still need a supplied test inbox. |
| TypeScript, lint and builds | Verified | Both applications completed production builds after the Next.js page/route type fixes. Backend lint passed with no warnings/errors; frontend has no lint errors and 17 warnings. |
| Production dependency security | Fixed | Both apps now use Next.js 15.5.28 and a locked PostCSS 8.5.23 override. Compatible transitive fixes applied; final production-only npm audits report zero advisories in both apps. Development tools retain advisories described below. |
| Business identity | Verified | Terms and Privacy identify LAD TRADE LTD, trading as LETTY. |
| Registered postal address and policy approval | Blocked | No registered postal address was supplied; EMAIL_LEGAL_ADDRESS is unset. Remaining policy and product-claim confirmations are listed below. |
| Stripe and wallet payments | Not Tested | Explicitly excluded from this audit. Locally configured secret/publishable keys have test-mode prefixes; neither was changed or used to take a payment. |

## Evidence and limits

- Final backend suite after dependency updates: **32 passed, 0 failed**, including security, privacy, public form validation, preorder, consent and email outbox tests.
- Frontend cart, redirect, checkout validation, payment layout and inventory tests: **14 passed, 0 failed**.
- Total: **46 passing tests** across these runs. Successful production transactions and real customer emails are not included.
- Frontend lint: **0 errors, 17 warnings**. Remaining warnings include checkout hook dependencies; country/currency/address changes and wallet remounts require explicit runtime testing before launch.
- Both production builds passed TypeScript checks against generated Next.js route/page types. The admin orders page now uses Promise-based searchParams; the backend admin notification route awaits Promise-based params.
- A generated Next.js route check exposed an existing synchronous dynamic-route parameter in the admin notification endpoint. It now awaits the Next.js 15 Promise-based params.
- Literal source scan: **98 local media paths**, no missing references; **20 literal internal links**, no unmatched routes; no remaining public-facing em-dash candidates in the scanned storefront source. This does not validate dynamically supplied URLs, remote images, Linux case sensitivity, CSS clipping or browser rendering.
- Credential-pattern scan of tracked text found no Stripe secret-key, Resend-key or private-key literals matching the checked patterns. This is a limited scan, not a complete secret-history or infrastructure audit. Environment values were not printed.
- Metadata icons are supplied through App Router icon files. The social preview image and email brand assets exist locally.
- Robots/private-page metadata now exclude account and other private or utility routes. Actual deployed robots/sitemap responses and search-engine indexing were not verified.
- Initial builds stalled. After security updates, both standard Next.js 15.5.28 production builds completed compilation, type/lint checks, page generation and build traces. BUILD_ID and complete route tables exist for both isolated audit outputs. The frontend build script now uses the standard compiler that completed these checks; its development script is unchanged.
- Final built-preview HTTP sweep: **40 public URLs returned 200**, and the deliberately nonexistent URL returned the expected **404**. This includes the correct /departments/fragrances route and the liner page that had returned a development-server error. It does not prove browser redirects, client-side interactions, mobile layout or accessibility.
- Local backend checks: unauthenticated admin orders returned **401**; order reads without guest credentials returned **400**; public inventory returned **200**. The session endpoint intentionally returns 200 for an anonymous session with customer:null; no customer records were queried by these anonymous checks.
- Image optimisation smoke test returned **200**, image/jpeg, **37,416 bytes** for a 640px campaign image. The initial local optimisation took approximately 3.1 seconds. This verifies the updated native image pipeline, not production Core Web Vitals.
- The frontend build retains the configured API rewrite to lettyecommerce.onrender.com. No frontend form was submitted against that backend. New backend permission smoke checks targeted the local built backend directly; a complete frontend-to-local-backend form flow is still unverified.
- Audit builds used a separate output directory. Matching generated TypeScript configuration files were restored from pre-audit copies. Logs under .launch-audit are local and ignored by Git.

## Email coverage

| Flow | Checked | Still required |
| --- | --- | --- |
| Account setup/password reset | Ownership-before-password, expiry wording, single-use concurrency, session invalidation, failed-send handling | Supplied test inbox, expired/reused links in a browser, actual delivery and spam placement |
| Contact/ambassador enquiries | Required fields, persistence failure handling, customer acknowledgement only after persistence or owner acceptance | Successful submission to a controlled inbox, operator notification and duplicate/retry behavior during outages |
| Newsletter and optional campaigns | Subscription writes, signed unsubscribe, opt-out suppression | Consent behavior in every signup surface, controlled delivery and provider unsubscribe checks |
| Order/preorder confirmation | Paid guard, dispatch wording, queue dedupe, lease and retry tests | Outbox schema, configured scheduler, Stripe webhooks, real provider acceptance to a controlled inbox |
| Shipping/refund/review/satisfaction/restock | Trigger and template source inspected; optional sends have consent checks in the reviewed jobs | Controlled lifecycle tests, restock notification trigger, failed-send recovery and mobile email rendering |

Only confirmation emails have the reviewed durable outbox. Do not assume every transactional or marketing email has durable retries. Account links can be requested again after failure; other send failures require verification of their specific recovery path. Provider credentials being present does not prove sender-domain verification, inbox delivery or sufficient sending quota.

## Remaining launch blockers

1. **Review the mwah database change and confirm real allocation quantities.** The configured database contains no mwah product. Review migration 034 against the intended database, including brand/category references and existing SKU identities. It intentionally starts new allocations at zero. Do not bulk-run unrelated migrations or invent allocation numbers.
2. **Make the email outbox available.** A GET with limit zero returned PGRST205, so the table is absent from the API schema cache or otherwise unavailable. Review migration 035, database state and schema-cache refresh requirements. Its source includes a unique dedupe key and service-only permissions. Earlier HEAD responses were inconclusive and are not accepted as proof of table availability. No migration was applied. Migration 028 includes password-reset-token row-level security in source; its active permissions in the intended deployment database still require confirmation.
3. **Verify scheduled job configuration.** Confirm the matching backend and GitHub JOBS_SECRET_KEY in the deployment environments and prove the retry scheduler runs. Local development configuration lacks the key. Do not call production email/expiry jobs as an unreviewed smoke test.
4. **Supply the registered postal address.** Add only the owner-confirmed address to legal pages and the relevant email configuration. Company identity is LAD TRADE LTD, trading as LETTY.
5. **Review development-tool advisories.** Production dependencies have zero reported advisories. The full frontend audit still reports 11 affected development packages (10 high, 1 moderate), and backend reports 5 high, largely through ESLint glob tooling; frontend also includes generator/CLI dependencies. These counts include dependency chains, not unique exploitable website bugs. No forced framework downgrade/major upgrade or tool removal was performed. Review these before running tools on untrusted input, and track upstream fixes.
6. **Complete the public-page and account browser audit in a responsive environment.** This includes mobile menu, header/footer, hero crops, product shade selection, accordions, wishlist/cart persistence, checkout validation, empty states, form errors and keyboard focus.
7. **Verify email delivery using an expressly supplied test inbox.** No real customer was emailed. Test account setup/reset, contact, newsletter/unsubscribe and the complete order lifecycle before launch.
8. **Complete the Stripe checklist below.** Payment, provider eligibility and webhook behavior remain unverified.

## Information needed from the owner

- Registered postal address for LAD TRADE LTD and any company-registration details intended for the website.
- Confirmed mwah allocation for Ivory and Noir separately; keep the approved dispatch estimate unless changed explicitly.
- A controlled test inbox and permission to use that exact address for lifecycle email tests.
- Confirmation of remaining operational policy details: return inspection times, damaged-item reporting guidance, replacement/refund handling, support hours, supported delivery destinations/rates and any commission arrangements. No new terms were invented.
- Manufacturer/package confirmation of the final ingredient spellings and other product-specific claims such as vegan, cruelty-free and wear-duration claims. SPF 15 was explicitly confirmed by the owner and retained.
- Confirmation that displayed creator handles, locations, videos, imagery permissions and bestseller labels are accurate. Source data alone does not establish attribution rights or sales evidence.

## Separate Stripe test-mode checklist for later

Use only test-mode configuration and controlled customer details. Do not use real customer cards or send to real customer inboxes.

1. Confirm the intended Stripe account, test-mode publishable/secret pair, webhook signing secret, enabled methods and registered website domains. Verify PayPal and buy-now-pay-later eligibility for the actual UK business account and each target country/currency; do not promise a method merely because its logo is displayed.
2. Test card success, decline, 3DS success/cancellation, network timeouts and double-clicks. Confirm server-priced totals, taxes, shipping, currency and discount rules agree with the checkout display.
3. Test Apple Pay, Google Pay, Link and PayPal on supported mobile and desktop environments. Verify compact/mobile layout, keyboard access and useful fallback messaging when a provider is unavailable. Four configured methods are not proof that every device is eligible for all four.
4. Test Klarna and Clearpay in eligible country/currency/order combinations, including a specific eligibility check for Canadian customers using the UK Stripe account. Verify approved, declined, cancelled and pending returns without falsely showing a paid order.
5. Change country, currency, address, shipping method, coupon and quantity before and during payment. Check stale requests, wallet remounts, alternative-payment selection, missing-field focus and retry guidance.
6. Test webhook signature rejection, duplicate delivery, delayed delivery, payment pending, failed payments and out-of-order events. Only a verified paid result should confirm an order; fulfillment, coupon use and stock commitment must occur once.
7. Test mwah Ivory/Noir separately and mixed carts. Verify GBP 17 pricing, the approved dispatch estimate, edition, reservation/allocation limits and the preorder confirmation. Confirm Lash Book Kit stays GBP 12 and is never labeled preorder.
8. With an approved test inbox, verify exactly one paid-order confirmation, outbox recovery after a simulated email failure, shipping updates and refunds. Unpaid or cancelled payments must not receive a paid-order confirmation. Check order tracking and currency/refund amounts.

## Route coverage

The storefront has 30 route patterns (including dynamic routes). Public HTTP coverage passed on the built preview; fresh visual checks for every entry below remain **Not Tested** because the browser security policy blocked tab access. Source/HTTP checks are not a visual pass.

| Page group | Routes requiring fresh mobile and desktop verification |
| --- | --- |
| Main storefront | /, /shop, /search, /collections, /departments |
| Editorial and campaigns | /about, /story, /preorder, /vip, /ambassadors, /ambassadors/apply |
| Shopping | /products/[slug], /collections/[slug], /departments/[slug], /wishlist, /cart, /checkout |
| Customer access | /login, /reset-password, /account, /account/orders, /account/orders/[id] |
| Help and policies | /contact, /faq, /shipping, /returns, /privacy, /terms |
| Utility | /feedback, /unsubscribe, not-found page, robots.txt, sitemap.xml |

Dynamic routes require each actual product, edition, collection and department to be exercised, including planned departments and redirects. Live admin access/role checks, successful forms and actual email layouts remain outside the completed browser coverage.

## Final evidence update

- Both production builds completed after dependency security fixes and Next.js type corrections. The final frontend npm run build also exited 0 after the shade-label correction.
- Both production-only dependency audits: 0 advisories. Full development-tool audit findings remain above.
- Backend tests: 32/32. Frontend tests: 14/14. Backend lint: clean. Frontend lint: 0 errors, 17 warnings.
- Public HTTP sweep: 40 successful pages plus expected 404. The final liner page returned 200 with Nightfall present and the old Rosewood label absent from its HTML. Visual/mobile review remains blocked by browser policy.
- Built previews were started locally on ports 3000 and 4000 for the read-only checks. No form, job endpoint, checkout confirmation or payment operation was invoked.
- Schema/configuration blockers, address, allocation quantities, controlled inbox delivery and Stripe tests remain unresolved. This audit does not declare the website launch-ready.

Local evidence files: .launch-audit/frontend-build-final.log, backend-build-final.log, backend-tests-final.log, frontend-tests-final.log, backend-lint-final.log, frontend-dependencies-final.json, backend-dependencies-final.json, frontend-all-dependencies-final.json, backend-all-dependencies-final.json, http-pages-final.json, api-image-smoke.json, configuration-final.json and final-product-smoke.json. These are ignored audit artifacts and contain no printed credentials or customer records.

