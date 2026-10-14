-- Align the live charge price with the storefront's £12 Lash Book kit.
-- Pre-order presentation is controlled by the storefront catalog.
UPDATE products
SET base_price_gbp = 12.00,
    base_price_usd = 12.00,
    meta_title = 'Letty Lash Book Kit',
    meta_description = 'Shop the Letty Lash Book Kit — 544 reusable cluster lashes in 60D, 100D, 120D and 150D with glue and remover included.'
WHERE slug = 'letty-lash-book-kit';

-- A variant override takes precedence over the base price at checkout.
UPDATE product_variants
SET price_override_gbp = NULL,
    price_override_usd = NULL,
    price_override_ngn = NULL
WHERE product_id IN (SELECT id FROM products WHERE slug = 'letty-lash-book-kit');
