-- ============================================================
-- Migration 011 — Customer & Order Indexes
-- ============================================================

-- Supports "new customers this month" queries on the admin dashboard
-- and any other date-range scans of customers.
CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON customers (created_at DESC);

-- Supports order analytics scans by payment_status + created_at.
-- The existing idx_orders_status_created is a prefix of this; we add
-- a dedicated one for created_at-only scans (e.g. monthly revenue).
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- Supports per-customer order history.
CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

-- L3: dedicated index on payment_reference for the lookup that powers
-- webhooks, verify, and markOrderPaid. The existing UNIQUE constraint
-- creates an implicit index, but the explicit one is named for clarity
-- and survives constraint drops during future refactors.
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference_explicit
  ON orders (payment_reference)
  WHERE payment_reference IS NOT NULL;

-- Supports gift-card lookups by code (recipient checkouts scan this path).
CREATE INDEX IF NOT EXISTS idx_gift_cards_code_active
  ON gift_cards (code)
  WHERE status = 'active';

-- Supports coupon validation scans by code (active only).
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
  ON coupons (code)
  WHERE is_active = true AND deleted_at IS NULL;
