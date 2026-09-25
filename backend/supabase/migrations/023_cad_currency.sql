-- 023: Canadian dollar (CAD) support.
--
-- The storefront offers Canada with CAD pricing (frontend COUNTRIES/EXCHANGE_RATES),
-- but the backend had no CAD currency: checkout init rejected CAD, and the
-- per-currency price columns did not exist. This adds the CAD columns mirroring
-- migration 008 and seeds the existing shipping methods' CAD rates from their
-- GBP rates at the storefront FX rate (1 GBP = 1.74 CAD), so the shipping quote
-- is consistent with every other currency column.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS base_price_cad NUMERIC(12,2) CHECK (base_price_cad >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_cad NUMERIC(12,2) CHECK (compare_at_price_cad >= 0);

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS price_override_cad NUMERIC(12,2) CHECK (price_override_cad >= 0);

ALTER TABLE shipping_methods
  ADD COLUMN IF NOT EXISTS rate_cad NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_cad >= 0),
  ADD COLUMN IF NOT EXISTS free_over_cad NUMERIC(12,2) CHECK (free_over_cad >= 0);

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS min_subtotal_cad NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount_cad NUMERIC(12,2);

-- Seed CAD shipping rates only where not yet configured (idempotent re-runs).
UPDATE shipping_methods
SET rate_cad = ROUND(rate_gbp * 1.74, 2),
    free_over_cad = ROUND(free_over_gbp * 1.74, 2)
WHERE rate_gbp > 0
  AND (rate_cad IS NULL OR rate_cad = 0);
