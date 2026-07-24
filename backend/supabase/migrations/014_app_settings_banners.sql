-- ============================================================
-- Migration 014 — Admin app settings + homepage banners
-- Adds the tables needed for the admin settings + marketing
-- sections.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS banners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  subtitle     TEXT,
  image_url    TEXT,
  link_url     TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  position     INT NOT NULL DEFAULT 0,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Allow site-wide singletons.
INSERT INTO app_settings (key, value, description)
VALUES
  ('store',      '{"name":"Letty","tagline":"Atelier of quiet luxury"}'::JSONB, 'Storefront identity'),
  ('contact',    '{"email":"hello@letty.com","phone":"+1 000 000 0000","instagram":"@letty"}'::JSONB, 'Contact details'),
  ('shipping',   '{"default_zone":"NG","fallback_rate_usd":15,"fallback_rate_ngn":12000}'::JSONB, 'Shipping defaults'),
  ('payments',   '{"stripe_publishable":null,"paystack_publishable":null,"auto_capture":true}'::JSONB, 'Payment gateway settings'),
  ('marketing',  '{"welcome_discount_pct":10,"abandoned_cart_after_hours":24,"abandoned_cart_reminders":2}'::JSONB, 'Marketing automation')
ON CONFLICT (key) DO NOTHING;
