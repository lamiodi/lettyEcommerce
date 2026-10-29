-- ============================================================
-- 035 — Clear legacy variant price overrides to allow global FX rates
--
-- Product variants previously had hardcoded price_override_usd = 12 / 9
-- from the initial transfer script, which forced fixed 1:1 pricing with GBP
-- and bypassed both live and admin-configured exchange rates at checkout.
-- Clearing them allows the base GBP price to multiply cleanly by the
-- admin's configured FX rates (or live ECB rates).
-- ============================================================

UPDATE product_variants
SET price_override_usd = NULL,
    price_override_ngn = NULL
WHERE sku LIKE 'LET-LG-%' OR sku LIKE 'LET-LL-%';
