-- ============================================================
-- Migration 003 — Shipping, Tax, Orders, Coupons, Gift Cards
-- ============================================================

-- ==========================================
-- 6. SHIPPING, TAXES & RETURNS
-- ==========================================
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries JSONB NOT NULL,            -- ["NG", "GH", "US"]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rate_ngn NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_ngn >= 0),
  rate_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (rate_usd >= 0),
  free_over_ngn NUMERIC(12,2) CHECK (free_over_ngn >= 0),
  free_over_usd NUMERIC(12,2) CHECK (free_over_usd >= 0),
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_shipping_methods_updated_at
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_shipping_methods_zone ON shipping_methods (zone_id);

CREATE TABLE IF NOT EXISTS tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  state TEXT,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  is_inclusive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_tax_rules_updated_at
  BEFORE UPDATE ON tax_rules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_tax_rules_country_state ON tax_rules (country, state);

-- ==========================================
-- 7. ORDERS, COUPONS & GIFT CARDS
-- ==========================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CITEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
  min_subtotal_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount_ngn NUMERIC(12,2),
  max_discount_usd NUMERIC(12,2),
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product', 'collection')),
  applies_to_ids JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_limit INT,
  usage_limit_per_customer INT,
  times_used INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CITEXT UNIQUE NOT NULL,
  initial_balance NUMERIC(12,2) NOT NULL CHECK (initial_balance > 0),
  current_balance NUMERIC(12,2) NOT NULL CHECK (current_balance >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('NGN', 'USD', 'EUR', 'GBP', 'GHS', 'ZAR', 'KES')),
  purchaser_order_id UUID,
  recipient_email CITEXT NOT NULL,
  recipient_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'void')),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient ON gift_cards (recipient_email);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT public.generate_order_number(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email CITEXT NOT NULL,
  customer_phone TEXT,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  currency TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_card_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL,
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('stripe', 'paystack')),
  payment_reference TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned', 'cancelled')),
  notes TEXT,
  internal_notes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (payment_status, fulfillment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders (payment_reference);

-- Add the deferred FK from reviews -> orders
ALTER TABLE reviews
  ADD CONSTRAINT reviews_order_fk
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_snapshot JSONB NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  fulfilled_quantity INT NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items (variant_id);

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,        -- 'placed', 'paid', 'packed', 'shipped', 'delivered', 'returned', 'cancelled', 'refunded'
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON order_events (order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'refunded', 'cancelled')),
  reason TEXT,
  customer_note TEXT,
  admin_note TEXT,
  refund_amount NUMERIC(12,2),
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns (order_id);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_card_tx_gift_card
  ON gift_card_transactions (gift_card_id, created_at DESC);
