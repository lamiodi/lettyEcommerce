-- ============================================================
-- Migration 001 — Identity, Customers & Addresses
-- ============================================================

-- ==========================================
-- 1. ADMIN, ROLES & NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'support'
    CHECK (role IN ('owner', 'admin', 'manager', 'inventory', 'support', 'marketing', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created
  ON audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                  -- 'new_order', 'low_stock', 'refund_requested', 'review_pending'
  entity_id UUID,
  payload JSONB DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON admin_notifications (is_read, created_at DESC)
  WHERE is_read = false;

-- ==========================================
-- 2. CUSTOMERS & ADDRESSES
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  store_credit_ngn NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (store_credit_ngn >= 0),
  store_credit_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (store_credit_usd >= 0),
  total_spent_ngn NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_spent_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers ((lower(email::TEXT)));

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,                          -- 'Home', 'Office', etc.
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,               -- ISO 3166-1 alpha-2
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  is_default_shipping BOOLEAN NOT NULL DEFAULT false,
  is_default_billing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses (customer_id);

-- Maintain a single default per (customer, kind) pair
CREATE UNIQUE INDEX IF NOT EXISTS uniq_addresses_default_shipping
  ON addresses (customer_id)
  WHERE is_default_shipping = true;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_addresses_default_billing
  ON addresses (customer_id)
  WHERE is_default_billing = true;
