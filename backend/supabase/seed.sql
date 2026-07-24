-- ============================================================
-- Migration 007 — Seed Data (idempotent)
-- Run only on fresh databases. Safe to re-run thanks to ON CONFLICT.
-- ============================================================

-- ----- Shipping Zones -----
INSERT INTO shipping_zones (id, name, countries) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Nigeria',   '["NG"]'::JSONB),
  ('22222222-2222-2222-2222-222222222222', 'West Africa', '["GH", "SN", "CI"]'::JSONB),
  ('33333333-3333-3333-3333-333333333333', 'East Africa', '["KE", "TZ", "UG"]'::JSONB),
  ('44444444-4444-4444-4444-444444444444', 'Southern Africa', '["ZA", "BW", "NA"]'::JSONB),
  ('55555555-5555-5555-5555-555555555555', 'International', '["US", "GB", "FR", "DE", "IT", "ES", "NL", "CA", "AU"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipping_methods (zone_id, name, description, rate_ngn, rate_usd, free_over_ngn, free_over_usd, estimated_days, position) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Lagos Standard',   'Delivery within Lagos', 1500, 5,  50000, 200, '1-2 business days', 0),
  ('11111111-1111-1111-1111-111111111111', 'Nigeria Express',  'Next-day delivery',     3500, 12, 100000, 350, '1 business day',    1),
  ('11111111-1111-1111-1111-111111111111', 'Nigeria Standard', 'Mainland delivery',     2500, 8,  75000, 250, '2-4 business days', 2),
  ('22222222-2222-2222-2222-222222222222', 'West Africa Express', 'Express to West Africa', 0, 25, NULL, 400, '3-5 business days', 0),
  ('33333333-3333-3333-3333-333333333333', 'East Africa Express', 'Express to East Africa', 0, 30, NULL, 500, '3-5 business days', 0),
  ('44444444-4444-4444-4444-444444444444', 'Southern Africa Express', 'Express to Southern Africa', 0, 35, NULL, 600, '4-6 business days', 0),
  ('55555555-5555-5555-5555-555555555555', 'International Express', 'Express worldwide', 0, 45, NULL, 800, '5-10 business days', 0)
ON CONFLICT DO NOTHING;

-- ----- Tax Rules -----
INSERT INTO tax_rules (country, state, rate, is_inclusive) VALUES
  ('NG', NULL, 7.50, true),
  ('GH', NULL, 15.00, true),
  ('KE', NULL, 16.00, true),
  ('ZA', NULL, 15.00, true),
  ('US', 'CA', 8.50, false),
  ('US', 'NY', 8.875, false),
  ('US', 'TX', 6.25, false),
  ('GB', NULL, 20.00, true),
  ('FR', NULL, 20.00, true),
  ('DE', NULL, 19.00, true),
  ('IT', NULL, 22.00, true),
  ('ES', NULL, 21.00, true),
  ('NL', NULL, 21.00, true)
ON CONFLICT DO NOTHING;

-- ----- Default Settings -----
INSERT INTO settings (key, value, description) VALUES
  ('store', jsonb_build_object(
    'name', 'LETTY',
    'currency_default', 'USD',
    'currencies_supported', ARRAY['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES'],
    'low_stock_threshold', 5,
    'free_shipping_threshold_usd', 200
  ), 'Global store configuration'),
  ('checkout', jsonb_build_object(
    'guest_checkout_enabled', true,
    'abandoned_cart_reminder_hours', 24,
    'reservation_ttl_minutes', 30
  ), 'Checkout behavior'),
  ('payments', jsonb_build_object(
    'stripe_enabled', true,
    'paystack_enabled', true,
    'currencies_stripe', ARRAY['USD', 'EUR', 'GBP'],
    'currencies_paystack', ARRAY['NGN', 'GHS', 'ZAR', 'KES']
  ), 'Payment gateway configuration')
ON CONFLICT (key) DO NOTHING;
