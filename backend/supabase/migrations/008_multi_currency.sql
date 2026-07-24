-- ============================================================
-- Migration 008 — Multi-currency pricing
-- Adds per-currency price columns for EUR, GBP, GHS, ZAR, KES.
-- Existing NGN / USD columns are kept; nullable for partial coverage.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS base_price_eur NUMERIC(12,2) CHECK (base_price_eur >= 0),
  ADD COLUMN IF NOT EXISTS base_price_gbp NUMERIC(12,2) CHECK (base_price_gbp >= 0),
  ADD COLUMN IF NOT EXISTS base_price_ghs NUMERIC(12,2) CHECK (base_price_ghs >= 0),
  ADD COLUMN IF NOT EXISTS base_price_zar NUMERIC(12,2) CHECK (base_price_zar >= 0),
  ADD COLUMN IF NOT EXISTS base_price_kes NUMERIC(12,2) CHECK (base_price_kes >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_eur NUMERIC(12,2) CHECK (compare_at_price_eur >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_gbp NUMERIC(12,2) CHECK (compare_at_price_gbp >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_ghs NUMERIC(12,2) CHECK (compare_at_price_ghs >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_zar NUMERIC(12,2) CHECK (compare_at_price_zar >= 0),
  ADD COLUMN IF NOT EXISTS compare_at_price_kes NUMERIC(12,2) CHECK (compare_at_price_kes >= 0);

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS price_override_eur NUMERIC(12,2) CHECK (price_override_eur >= 0),
  ADD COLUMN IF NOT EXISTS price_override_gbp NUMERIC(12,2) CHECK (price_override_gbp >= 0),
  ADD COLUMN IF NOT EXISTS price_override_ghs NUMERIC(12,2) CHECK (price_override_ghs >= 0),
  ADD COLUMN IF NOT EXISTS price_override_zar NUMERIC(12,2) CHECK (price_override_zar >= 0),
  ADD COLUMN IF NOT EXISTS price_override_kes NUMERIC(12,2) CHECK (price_override_kes >= 0);

ALTER TABLE shipping_methods
  ADD COLUMN IF NOT EXISTS rate_eur NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_eur >= 0),
  ADD COLUMN IF NOT EXISTS rate_gbp NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_gbp >= 0),
  ADD COLUMN IF NOT EXISTS rate_ghs NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_ghs >= 0),
  ADD COLUMN IF NOT EXISTS rate_zar NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_zar >= 0),
  ADD COLUMN IF NOT EXISTS rate_kes NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_kes >= 0),
  ADD COLUMN IF NOT EXISTS free_over_eur NUMERIC(12,2) CHECK (free_over_eur >= 0),
  ADD COLUMN IF NOT EXISTS free_over_gbp NUMERIC(12,2) CHECK (free_over_gbp >= 0),
  ADD COLUMN IF NOT EXISTS free_over_ghs NUMERIC(12,2) CHECK (free_over_ghs >= 0),
  ADD COLUMN IF NOT EXISTS free_over_zar NUMERIC(12,2) CHECK (free_over_zar >= 0),
  ADD COLUMN IF NOT EXISTS free_over_kes NUMERIC(12,2) CHECK (free_over_kes >= 0);

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS min_subtotal_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_subtotal_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_subtotal_ghs NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_subtotal_zar NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_subtotal_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount_eur NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS max_discount_gbp NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS max_discount_ghs NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS max_discount_zar NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS max_discount_kes NUMERIC(12,2);

-- Constrain orders.currency to the supported set
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_currency_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_currency_check
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES'));

-- Add a helper that returns the per-currency numeric column name
CREATE OR REPLACE FUNCTION public.currency_column(p_currency TEXT, p_prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  suffix TEXT;
BEGIN
  suffix := CASE p_currency
    WHEN 'USD' THEN 'usd'
    WHEN 'EUR' THEN 'eur'
    WHEN 'GBP' THEN 'gbp'
    WHEN 'NGN' THEN 'ngn'
    WHEN 'GHS' THEN 'ghs'
    WHEN 'ZAR' THEN 'zar'
    WHEN 'KES' THEN 'kes'
    ELSE NULL
  END;
  IF suffix IS NULL THEN
    RAISE EXCEPTION 'Unsupported currency: %', p_currency;
  END IF;
  RETURN p_prefix || '_' || suffix;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
