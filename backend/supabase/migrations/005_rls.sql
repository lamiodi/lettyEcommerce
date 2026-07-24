-- ============================================================
-- Migration 005 — Row Level Security (RLS)
-- ============================================================
-- Strategy:
--   - Public read on products, variants, media, categories, brands, collections, reviews.
--   - Customers can manage their own data (orders, wishlist, addresses, reviews).
--   - All admin tables are completely blocked from public / anon.
--   - Server-side writes go through the service role key which bypasses RLS.
--     Keep this in mind: validation lives in the API layer, not in RLS.

-- Helper to determine current role context
CREATE OR REPLACE FUNCTION public.current_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    current_setting('request.jwt.claims', true)::JSONB->>'role',
    'anon'
  );
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- Products / Variants / Media
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_variants" ON product_variants;
CREATE POLICY "public_read_active_variants" ON product_variants
  FOR SELECT USING (is_active = true);

ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_media" ON product_media;
CREATE POLICY "public_read_product_media" ON product_media
  FOR SELECT USING (true);

ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_variant_options" ON variant_options;
CREATE POLICY "public_read_variant_options" ON variant_options
  FOR SELECT USING (true);

-- ==========================================
-- Catalog metadata
-- ==========================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_brands" ON brands;
CREATE POLICY "public_read_active_brands" ON brands
  FOR SELECT USING (is_active = true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_categories" ON categories;
CREATE POLICY "public_read_active_categories" ON categories
  FOR SELECT USING (is_active = true);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_collections" ON collections;
CREATE POLICY "public_read_active_collections" ON collections
  FOR SELECT USING (is_active = true);

ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_collection_products" ON collection_products;
CREATE POLICY "public_read_collection_products" ON collection_products
  FOR SELECT USING (true);

-- ==========================================
-- Reviews
-- ==========================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews
  FOR SELECT USING (is_approved = true);

-- ==========================================
-- CMS
-- ==========================================
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_cms" ON cms_sections;
CREATE POLICY "public_read_active_cms" ON cms_sections
  FOR SELECT USING (is_active = true);

-- ==========================================
-- Shipping / Tax (read-only public)
-- ==========================================
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_shipping_zones" ON shipping_zones;
CREATE POLICY "public_read_shipping_zones" ON shipping_zones
  FOR SELECT USING (is_active = true);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_shipping_methods" ON shipping_methods;
CREATE POLICY "public_read_shipping_methods" ON shipping_methods
  FOR SELECT USING (is_active = true);

ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_tax_rules" ON tax_rules;
CREATE POLICY "public_read_tax_rules" ON tax_rules
  FOR SELECT USING (true);

-- ==========================================
-- Orders & Checkout
-- ==========================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_create_orders" ON orders;
CREATE POLICY "public_create_orders" ON orders
  FOR INSERT WITH CHECK (true);
-- (No public read — orders are queried by payment_reference via the API.)

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_create_order_items" ON order_items;
CREATE POLICY "public_create_order_items" ON order_items
  FOR INSERT WITH CHECK (true);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_order_events" ON order_events;
CREATE POLICY "public_no_order_events" ON order_events FOR ALL USING (false) WITH CHECK (false);

-- ==========================================
-- Customers
-- ==========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_customers" ON customers;
CREATE POLICY "public_no_customers" ON customers FOR ALL USING (false) WITH CHECK (false);
-- (We do not allow anon to read or modify customers; everything goes via API.)

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_addresses" ON addresses;
CREATE POLICY "public_no_addresses" ON addresses FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_wishlists" ON wishlists;
CREATE POLICY "public_no_wishlists" ON wishlists FOR ALL USING (false) WITH CHECK (false);

-- ==========================================
-- Coupons, Gift Cards
-- ==========================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_coupons" ON coupons;
CREATE POLICY "public_read_active_coupons" ON coupons
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_gift_cards" ON gift_cards;
CREATE POLICY "public_no_gift_cards" ON gift_cards FOR ALL USING (false) WITH CHECK (false);

-- ==========================================
-- Inventory ledger (admin-only)
-- ==========================================
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_no_inventory" ON inventory_transactions;
CREATE POLICY "public_no_inventory" ON inventory_transactions FOR ALL USING (false) WITH CHECK (false);

-- ==========================================
-- Waitlist, Newsletter (insert-only for public)
-- ==========================================
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_create_waitlist" ON waitlist;
CREATE POLICY "public_create_waitlist" ON waitlist FOR INSERT WITH CHECK (true);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_create_newsletter" ON newsletter_subscribers;
CREATE POLICY "public_create_newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- ==========================================
-- Admin tables — fully locked down
-- ==========================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_access_admins" ON admins;
CREATE POLICY "no_public_access_admins" ON admins
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_audit" ON audit_logs;
CREATE POLICY "no_public_audit" ON audit_logs
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_admin_notifications" ON admin_notifications;
CREATE POLICY "no_public_admin_notifications" ON admin_notifications
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_returns" ON returns;
CREATE POLICY "no_public_returns" ON returns
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_create_abandoned_carts" ON abandoned_carts;
CREATE POLICY "public_create_abandoned_carts" ON abandoned_carts
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_abandoned_carts" ON abandoned_carts;
CREATE POLICY "public_update_abandoned_carts" ON abandoned_carts
  FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_metrics" ON daily_metrics;
CREATE POLICY "no_public_metrics" ON daily_metrics FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_settings" ON settings;
CREATE POLICY "no_public_settings" ON settings FOR ALL USING (false) WITH CHECK (false);
