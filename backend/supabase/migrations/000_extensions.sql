-- ============================================================
-- Migration 000 — Extensions & Helper Functions
-- LETTY Ultimate Enterprise E-commerce Blueprint (v3)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive emails / codes

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to generate a LETTY order number, e.g. LETTY-20260101-AB12CD
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYYMMDD');
  v_rand TEXT := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
BEGIN
  RETURN FORMAT('LETTY-%s-%s', v_date, v_rand);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
