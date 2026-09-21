-- ============================================================
-- 017 — Launch performance indexes
--
--  * orders(customer_email, created_at): serves the guest order
--    lookup, verified-purchase checks, and any authenticated email
--    path — previously a sequential scan.
--  * Drop the duplicate payment_reference index (the UNIQUE
--    constraint already provides one; migration 011 added another).
--  * abandoned_carts partial indexes for the reminder cron scan and
--    the admin open-carts list.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_email_created
  ON orders (customer_email, created_at DESC);

DROP INDEX IF EXISTS idx_orders_payment_reference;

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_pending
  ON abandoned_carts (created_at)
  WHERE recovered_at IS NULL AND last_reminder_at IS NULL AND reminder_count < 2;

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_open_updated
  ON abandoned_carts (updated_at DESC)
  WHERE recovered_at IS NULL;
