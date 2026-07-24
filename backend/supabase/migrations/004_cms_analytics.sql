-- ============================================================
-- Migration 004 — CMS, Analytics, Abandoned Carts, Settings
-- ============================================================

-- ==========================================
-- 8. CMS & ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,         -- 'home', 'shop', 'product', 'collection', 'about'
  section_type TEXT NOT NULL,      -- 'hero', 'banner', 'collection_grid', 'editorial', 'marquee', 'testimonials'
  title TEXT,
  subtitle TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cms_sections_updated_at
  BEFORE UPDATE ON cms_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_cms_sections_page_position
  ON cms_sections (page_type, position)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS daily_metrics (
  metric_date DATE PRIMARY KEY,
  total_orders INT NOT NULL DEFAULT 0,
  total_revenue_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  abandoned_carts INT NOT NULL DEFAULT 0,
  avg_order_value_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ==========================================
-- 9. ABANDONED CARTS, NEWSLETTER, SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email CITEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cart JSONB NOT NULL DEFAULT '[]'::JSONB,
  currency TEXT,
  subtotal NUMERIC(12,2),
  recovery_token TEXT UNIQUE,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INT NOT NULL DEFAULT 0,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  source TEXT,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
