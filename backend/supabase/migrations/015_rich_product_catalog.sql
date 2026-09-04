-- ============================================================
-- Migration 015 — Rich Editorial Product Catalog & Customer Auth
-- ============================================================

-- Add rich editorial attributes to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS what_it_is TEXT,
  ADD COLUMN IF NOT EXISTS what_it_does TEXT,
  ADD COLUMN IF NOT EXISTS what_else_to_know JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS how_to_use_steps JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS pro_tip TEXT,
  ADD COLUMN IF NOT EXISTS beauty_hack JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS ingredients TEXT,
  ADD COLUMN IF NOT EXISTS pair_with JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT true;

-- Add shade & rich imagery columns to product_variants table
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS color_hex TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::JSONB;

-- Add password_hash & account status to customers table for user login
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for speedy customer lookup by email
CREATE INDEX IF NOT EXISTS idx_customers_email_active
  ON customers (email, is_active);
