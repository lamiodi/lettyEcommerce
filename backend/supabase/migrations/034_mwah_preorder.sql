-- Mwah preorder catalog. Allocation starts at zero until confirmed by the
-- merchant; this migration never invents stock or resets an existing balance.
BEGIN;

INSERT INTO products (
  id, slug, name, brand_id, category_id, description, short_description,
  base_price_usd, base_price_gbp, is_active, is_featured, is_new, is_bestseller,
  is_vegan, tagline, details, what_it_is, what_else_to_know, rating, review_count,
  meta_title, meta_description, og_image
)
SELECT
  '0e3b3f02-2682-4ee4-a118-39fc40b84d70', 'letty-mwah-lip-balm', 'mwah Lip Balm', b.id, c.id,
  'Your everyday lip-care ritual, with the signature LETTY touch. Discover mwah in two distinctive packaging editions: soft Ivory and striking Noir.',
  'A little love for your lips.', 17.00, 17.00, true, false, true, false,
  false, 'A little love for your lips.',
  '["Ivory and Noir packaging editions", "10 ml lip balm", "Preorder price: £17 per edition", "Estimated dispatch: late October–early November 2026"]'::jsonb,
  'An everyday lip balm, beautifully presented in your choice of Ivory or Noir packaging.',
  '["Full payment is taken when the preorder is placed.", "Estimated dispatch: late October–early November 2026. Delivery time starts after dispatch."]'::jsonb,
  0, 0, 'Meet mwah. Lip Balm Preorder', 'Preorder LETTY mwah Lip Balm in Ivory or Noir for £17.',
  'https://www.houseofletty.com/products/mwah/mwah-ivory.webp'
FROM brands b CROSS JOIN categories c
WHERE b.slug = 'letty' AND c.slug = 'makeup'
ON CONFLICT (slug) DO UPDATE SET
  base_price_gbp = EXCLUDED.base_price_gbp,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  what_else_to_know = EXCLUDED.what_else_to_know;

INSERT INTO product_variants (id, product_id, sku, color, color_hex, stock_quantity, is_active, position, image_url, images)
SELECT v.id::uuid, p.id, v.sku, v.color, v.hex, 0, true, v.position,
  v.image, jsonb_build_array(v.image)
FROM products p CROSS JOIN (VALUES
  ('37a4a139-b5e0-4266-9190-a0ba452ae04e', 'LET-MWAH-IV', 'Ivory Edition', '#f4eee5', 0, 'https://www.houseofletty.com/products/mwah/mwah-ivory.webp'),
  ('dd58882a-1d77-45e9-823f-12c491034a52', 'LET-MWAH-NR', 'Noir Edition', '#22201f', 1, 'https://www.houseofletty.com/products/mwah/mwah-noir.webp')
) AS v(id, sku, color, hex, position, image)
WHERE p.slug = 'letty-mwah-lip-balm'
ON CONFLICT (sku) DO UPDATE SET color = EXCLUDED.color, color_hex = EXCLUDED.color_hex,
  image_url = EXCLUDED.image_url, images = EXCLUDED.images;

INSERT INTO variant_options (variant_id, option_name, option_value)
SELECT id, 'Edition', color FROM product_variants WHERE sku IN ('LET-MWAH-IV', 'LET-MWAH-NR')
ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

INSERT INTO variant_options (variant_id, option_name, option_value)
SELECT id, 'Size', '10 ml' FROM product_variants WHERE sku IN ('LET-MWAH-IV', 'LET-MWAH-NR')
ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

INSERT INTO product_media (product_id, url, alt_text, position, is_primary, type)
SELECT p.id, v.image, v.alt, v.position, v.position = 0, 'image'
FROM products p CROSS JOIN (VALUES
  ('https://www.houseofletty.com/products/mwah/mwah-ivory.webp', 'LETTY mwah Lip Balm — Ivory Edition', 0),
  ('https://www.houseofletty.com/products/mwah/mwah-noir.webp', 'LETTY mwah Lip Balm — Noir Edition', 1)
) AS v(image, alt, position)
WHERE p.slug = 'letty-mwah-lip-balm'
  AND NOT EXISTS (SELECT 1 FROM product_media m WHERE m.product_id = p.id AND m.url = v.image);

INSERT INTO collection_products (collection_id, product_id, position)
SELECT c.id, p.id, 4 FROM collections c CROSS JOIN products p
WHERE c.slug = 'the-edit' AND p.slug = 'letty-mwah-lip-balm'
ON CONFLICT (collection_id, product_id) DO NOTHING;

COMMIT;
