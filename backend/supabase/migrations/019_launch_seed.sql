-- ============================================================
-- 019 — Launch seed data (idempotent)
--
--  * Tax rules: UK + EU standard VAT rates, inclusive (retail prices
--    already contain VAT). Without these rows the checkout charged
--    0% tax everywhere.
--  * GBP catalog prices: backfill from base_price_usd — the catalog's
--    base numbers ARE the intended GBP prices (£9 / £12); without the
--    backfill the server priced GBP orders via a hardcoded FX fallback
--    and undercharged ~22% vs the displayed price.
--  * Shipping zones + methods for UK / Europe / North America matching
--    the destination rates the storefront already displays. Destinations
--    outside these zones keep the calculator's international fallback.
-- ============================================================

-- ---------- Tax rules (VAT, inclusive) ----------
INSERT INTO tax_rules (country, state, rate, is_inclusive)
SELECT s.country, NULL, s.rate, TRUE
FROM (VALUES
  ('GB', 20.00),
  ('IE', 23.00), ('DE', 19.00), ('FR', 20.00), ('IT', 22.00), ('ES', 21.00),
  ('NL', 21.00), ('BE', 21.00), ('AT', 20.00), ('PT', 23.00), ('SE', 25.00),
  ('DK', 25.00), ('FI', 24.00), ('PL', 23.00), ('CZ', 21.00), ('GR', 24.00),
  ('HU', 27.00), ('RO', 19.00), ('BG', 20.00), ('HR', 25.00), ('SK', 20.00),
  ('SI', 22.00), ('EE', 22.00), ('LV', 21.00), ('LT', 21.00), ('LU', 17.00),
  ('CY', 19.00), ('MT', 18.00)
) AS s(country, rate)
WHERE NOT EXISTS (
  SELECT 1 FROM tax_rules t WHERE t.country = s.country AND t.state IS NULL
);

-- ---------- GBP catalog backfill ----------
UPDATE products
   SET base_price_gbp = base_price_usd
 WHERE base_price_gbp IS NULL
   AND base_price_usd IS NOT NULL
   AND base_price_usd > 0;

-- ---------- Shipping zones ----------
INSERT INTO shipping_zones (name, countries, is_active)
SELECT 'United Kingdom', '["GB"]'::jsonb, TRUE
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'United Kingdom');

INSERT INTO shipping_zones (name, countries, is_active)
SELECT 'Europe', '["FR","DE","IT","ES","NL","BE","IE","CH","AT","SE","NO","DK","FI","PT","GR","PL","CZ","HU","RO","BG","HR","SK","SI","EE","LV","LT","LU","CY","MT","IS"]'::jsonb, TRUE
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'Europe');

INSERT INTO shipping_zones (name, countries, is_active)
SELECT 'North America', '["US","CA"]'::jsonb, TRUE
WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE name = 'North America');

-- ---------- Shipping methods (per-currency rates; free over £150 equivalent) ----------
INSERT INTO shipping_methods (
  zone_id, name, description, rate_gbp, rate_usd, rate_eur, rate_ngn,
  free_over_gbp, free_over_usd, free_over_eur, free_over_ngn,
  estimated_days, is_active, position
)
SELECT z.id, 'Standard Tracked Delivery', 'Tracked courier delivery',
       4.99, 6.40, 5.90, 8200.00,
       150.00, 192.00, 176.00, 240000.00,
       '2-3 business days', TRUE, 0
FROM shipping_zones z
WHERE z.name = 'United Kingdom'
  AND NOT EXISTS (
    SELECT 1 FROM shipping_methods m WHERE m.zone_id = z.id AND m.name = 'Standard Tracked Delivery'
  );

INSERT INTO shipping_methods (
  zone_id, name, description, rate_gbp, rate_usd, rate_eur, rate_ngn,
  free_over_gbp, free_over_usd, free_over_eur, free_over_ngn,
  estimated_days, is_active, position
)
SELECT z.id, 'Europe Tracked Delivery', 'Tracked courier delivery',
       10.25, 13.10, 12.00, 16600.00,
       150.00, 192.00, 176.00, 240000.00,
       '3-5 business days', TRUE, 0
FROM shipping_zones z
WHERE z.name = 'Europe'
  AND NOT EXISTS (
    SELECT 1 FROM shipping_methods m WHERE m.zone_id = z.id AND m.name = 'Europe Tracked Delivery'
  );

INSERT INTO shipping_methods (
  zone_id, name, description, rate_gbp, rate_usd, rate_eur, rate_ngn,
  free_over_gbp, free_over_usd, free_over_eur, free_over_ngn,
  estimated_days, is_active, position
)
SELECT z.id, 'North America Tracked Delivery', 'Tracked courier delivery',
       20.00, 25.00, 23.00, 32000.00,
       150.00, 192.00, 176.00, 240000.00,
       '3-5 business days', TRUE, 0
FROM shipping_zones z
WHERE z.name = 'North America'
  AND NOT EXISTS (
    SELECT 1 FROM shipping_methods m WHERE m.zone_id = z.id AND m.name = 'North America Tracked Delivery'
  );
