-- 024: Stripe-only payments
-- Removes the never-used 'paystack' allowance from the orders gateway CHECK
-- (the backend router hardcodes Stripe; no row has ever been written with
-- another gateway) and drops the dead paystack_publishable key from the
-- 'payments' app_settings seed (migration 014).

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_gateway_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_gateway_check
  CHECK (payment_gateway IN ('stripe'));

UPDATE app_settings
SET value = value - 'paystack_publishable'
WHERE key = 'payments';
