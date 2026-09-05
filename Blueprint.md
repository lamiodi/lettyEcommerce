# 🌸 LETTY — Ultimate Enterprise E-commerce Blueprint (v5)

The definitive architectural blueprint and technical specification for **LETTY** — a world-class luxury e-commerce platform spanning **Hair, Beauty, Fragrance, Fashion, Eyewear, and Cosmetics**.

---

## 1. Executive Architecture Overview

LETTY is engineered as a decoupled, dual-tier enterprise application designed for ultra-high performance, luxury editorial aesthetics, global multi-currency checkout, and scalable cloud-native operations.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             LETTY ECOSYSTEM OVERVIEW                             │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│          STOREFRONT (Frontend)         │          CONTROL & API (Backend)        │
│          Next.js 15.5 App Router       │          Next.js 15.5 API / Admin       │
│          Port: 3000                    │          Port: 4000                     │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ • React 19 + Turbopack                 │ • Standalone Next.js 15.5 Microservice  │
│ • Tailwind CSS v4 + Radix Primitives   │ • Supabase PostgreSQL (25+ Tables)      │
│ • Aboreto & Tenor Sans Luxury Fonts    │ • 15 Database Migrations (000 → 015)    │
│ • Lenis Smooth Scroll + Framer Motion  │ • Atomic RPC Inventory & Ledger Engine  │
│ • Centralized Image & Brand Registry   │ • Dual Payments: Stripe + Paystack      │
│ • Interactive UGC Video Reels Engine   │ • Algolia v5 Full-Text Search Engine    │
│ • Editorial Community Masonry Showcase │ • Upstash QStash Async Job Queues       │
│ • Zustand Client Stores (Cart/Wishlist)│ • Upstash Redis Rate Limiting & Caching │
│ • 5 Luxury Department Storefronts      │ • Resend + React Email Luxury Templates │
│ • 17+ Full-Featured Admin Pages        │ • 7-Role Edge RBAC Permission Matrix    │
│ • Customer Auth & WhatsApp Concierge   │ • Customer JWT Auth & Profile Engine    │
│ • Dual-Currency (NGN/USD/EUR/GBP/etc.) │ • App Settings & UGC Dynamic Endpoints  │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Technology Stack & Package Ecosystem

### 2.1 Storefront (`frontend/`)

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js `15.5.21` (App Router, Turbopack) | Server Components, Streaming, Async Request APIs, ISR |
| **Runtime** | React `19.1.0` + TypeScript `5.x` | Modern reactive UI, strict static type safety |
| **Styling** | Tailwind CSS `v4` + `@tailwindcss/postcss` | High-performance CSS-first styling engine with design tokens |
| **Primitives** | Radix UI / Shadcn Primitives + `@base-ui/react` | Accessible headless UI foundation (Dialog, Accordion, Tooltip) |
| **Motion** | Framer Motion `12.42.2` | Editorial page reveals, staggered transitions, hover micro-interactions |
| **Smooth Scroll** | Lenis `1.3.25` | Momentum-based luxury viewport scrolling |
| **Carousels** | Embla Carousel React `8.6.0` | Touch-friendly editorial product rails & collection sliders |
| **State** | Zustand `5.0.14` | Persistent client state for Cart, Wishlist, Recently Viewed |
| **Notifications** | Sonner `2.0.7` | Luxury floating toast alerts |
| **Typography** | Google Fonts: Aboreto, Forum & Tenor Sans | Editorial display serifs paired with minimalist geometric sans |
| **Video Engine** | Native HTML5 Video + Framer Motion | Smooth vertical video reels with scrub controls, mute toggles, and shade tags |

### 2.2 API & Administration Service (`backend/`)

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js `15.5.21` (App Router API routes) | High-speed JSON endpoints & Server Actions on `:4000` |
| **Database** | Supabase PostgreSQL (`@supabase/ssr` `0.5.2`, `@supabase/supabase-js` `2.47.10`) | Relational persistence, Row-Level Security (RLS), ACID transactions |
| **International Pay** | Stripe `17.5.0` | Credit/Debit, Apple Pay, Google Pay for USD, EUR, GBP |
| **African Pay** | Paystack `2.0.1` | Local cards, bank transfers, USSD, MoMo for NGN, GHS, ZAR, KES |
| **Search Engine** | Algolia v5 (`algoliasearch` `5.20.0`) | Instant search, typo tolerance, multi-faceted filtering |
| **Job Queue** | Upstash QStash `2.7.20` | Serverless async event dispatching (post-payment, cart recovery, syncs) |
| **Rate Limiting** | Upstash Redis `1.34.3` + `@upstash/ratelimit` `2.0.5` | Sliding-window API defense & IP protection |
| **Transactional Email**| Resend `4.0.1` + `@react-email/components` `0.0.36` | Luxury branded transactional emails |
| **Auth & Security** | `jose` `5.9.6` + `bcryptjs` `2.4.3` | Edge-compatible JWT verification & password hashing (Admin & Customer) |
| **Validation** | Zod `3.24.1` | Strict runtime schema enforcement on all inputs |
| **Logging** | Pino `9.5.0` | Structured JSON logging with Edge runtime fallback |

---

## 3. Environment Configuration

### Frontend (`frontend/.env.local`)
```env
# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Public Supabase (for direct client queries where applicable)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Algolia InstantSearch
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_algolia_search_key
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=letty_products

# Payment Public Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Backend (`backend/.env.local`)
```env
# Supabase Database & Service Role
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Server-only: bypasses RLS

# Admin & Customer Edge Auth
JWT_SECRET_KEY=super_secure_32_plus_char_secret_key_here

# International Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# African Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Search (Algolia)
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_ADMIN_KEY=your_algolia_admin_key
ALGOLIA_SEARCH_KEY=your_algolia_search_key
ALGOLIA_INDEX_NAME=letty_products

# Queues & Caching (Upstash)
QSTASH_TOKEN=ey...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM="LETTY <concierge@letty.com>"

# Security & CORS
FRONTEND_ORIGINS=http://localhost:3000,https://letty.com
LOG_LEVEL=info
NEXT_PUBLIC_SITE_URL=https://letty.com
```

---

## 4. Design System & Luxury UI Architecture

### 4.1 Typography System

LETTY employs a deliberate editorial typography pairing loaded via Google Fonts that evokes quiet luxury and couture sophistication:

```
┌───────────────────────────┬────────────────────────────────────────────────────────┐
│ Font Family               │ Application & Role                                     │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Aboreto                   │ Editorial Display Serif — Hero titles, section headers,│
│ (Google Fonts serif)      │ collection titles, marquee texts, department doors.    │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Forum                     │ Classical Roman Accents — Editorial pull quotes,       │
│ (Google Fonts serif)      │ sub-headings, secondary badges, testimonial callouts.  │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Tenor Sans                │ Clean Geometric Sans-Serif — Product titles, UI labels,│
│ (Google Fonts sans-serif) │ body copy, pricing, navigation links, button CTAs.     │
└───────────────────────────┴────────────────────────────────────────────────────────┘
```

Implementation in `frontend/src/app/layout.tsx`:
```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Aboreto&family=Forum&family=Tenor+Sans&display=swap"
/>
```

### 4.2 Luxury Color Palette & Design Tokens (`globals.css`)

```css
/* LETTY Color System */
--background: #ede5da;       /* Warm Cream / Sand Linen: Rich, organic luxury canvas */
--foreground: #32150d;       /* Deep Espresso: Deepest couture brown for typography */
--color-gold: #c5a880;       /* Burnished Bronze / Quiet Gold: Primary accents & borders */
--color-ink: #1a0b06;        /* Noir Espresso: Midnight depth for dark surfaces & footer */
--color-stone: #8c7365;      /* Warm Mineral Taupe: Secondary copy, subtle indicators */
--color-ivory: #faf7f2;      /* Pure Alabaster: Elevated card fills, dropdowns, inputs */
--color-line: #d8cbba;       /* Soft Linen Hairline: Elegant 1px boundaries and dividers */
--color-surface: #f4eee5;    /* Tinted Cream Surface: Modal backings, drawers, rails */
```

### 4.3 Brand Identity Assets & Adaptive Logo (`frontend/public/brand/`)

The LETTY visual mark is rendered via the unified `<Logo />` component (`frontend/src/components/shared/logo.tsx`):
- **Light Theme**: `/brand/letty-logo-light.png` (warm espresso lockup on light cream backgrounds)
- **Dark Surfaces**: `/brand/letty-logo-dark.png` (transparent high-key lockup on dark footers & banners)
- **Emblem / Monogram**: `/brand/letty-emblem.png` and `src/app/icon.png` (512x512 app favicon & apple icon)

### 4.4 Centralized Media & Image Architecture

LETTY utilizes a strict media registry (`frontend/src/lib/images.ts`) paired with optimized static assets:
1. **Product Imagery**: High-definition shade photography in `/products/lip-gloss/` (8 shades) and `/products/lip-liner/` (7 shades).
2. **Campaign & Hero Assets**: `/IMG_6386.PNG`, `/IMG_6543.PNG`, `/IMG_6534.PNG`, `/IMG_6549.PNG`, `/IMG_6270.PNG`, `/IMG_6571.PNG`.
3. **UGC Video Assets**: Direct H.264/HEVC media files (`/IMG_5725.MOV`, `/IMG_6572.MOV`, `/IMG_6577.MOV`, `/IMG_9502.MOV`) paired with high-performance poster fallbacks (`/images/ugc-poster-1.jpg` through `ugc-poster-4.jpg`).
4. **Community Showcase**: `/images/letty_community_ambassadors.jpg` for high-fashion masonry visual narrative.
5. **Zero Redundancy**: All unreferenced SVG placeholders, scratch extractions, and duplicate timestamped exports are purged from `public/`.

---

## 5. Complete Database Schema (Supabase / PostgreSQL)

Representing the complete 15-migration architecture (`supabase/migrations/000` through `015`):

```sql
-- ============================================================
-- 1. EXTENSIONS & IDENTITY (000, 001)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'support'
    CHECK (role IN ('owner', 'admin', 'manager', 'inventory', 'support', 'marketing', 'editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_order', 'low_stock', 'refund_requested', 'review_pending', 'contact_inquiry')),
  title TEXT NOT NULL,
  message TEXT,
  entity_id UUID,
  entity_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                     -- Added in 015 for customer auth
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, -- Added in 015
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  store_credit_ngn NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (store_credit_ngn >= 0),
  store_credit_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (store_credit_usd >= 0),
  total_spent_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email_active
  ON customers (email, is_active);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_line1 TEXT NOT NULL,
  street_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CATALOG & EDITORIAL ATTRIBUTES (002, 008, 015)
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  -- Editorial Storytelling (Added in 015)
  tagline TEXT,
  what_it_is TEXT,
  what_it_does TEXT,
  what_else_to_know JSONB DEFAULT '[]'::JSONB,
  how_to_use_steps JSONB DEFAULT '[]'::JSONB,
  pro_tip TEXT,
  beauty_hack JSONB DEFAULT '{}'::JSONB,
  ingredients TEXT,
  pair_with JSONB DEFAULT '{}'::JSONB,
  details JSONB DEFAULT '[]'::JSONB,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  is_vegan BOOLEAN DEFAULT true,
  -- Multi-Currency Base Prices
  base_price_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_ghs NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_zar NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_price_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  department TEXT NOT NULL CHECK (department IN ('hair', 'fragrance', 'beauty', 'fashion', 'eyewear', 'cosmetics')),
  brand TEXT NOT NULL DEFAULT 'LETTY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  -- Shade & Rich Attributes (Added in 015)
  color TEXT,
  color_hex TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::JSONB,
  -- Multi-Currency Price Overrides
  price_override_ngn NUMERIC(12,2),
  price_override_usd NUMERIC(12,2),
  price_override_eur NUMERIC(12,2),
  price_override_gbp NUMERIC(12,2),
  price_override_ghs NUMERIC(12,2),
  price_override_zar NUMERIC(12,2),
  price_override_kes NUMERIC(12,2),
  weight_grams INT,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,  -- 'Size', 'Color', 'Volume', 'Shade'
  option_value TEXT NOT NULL, -- '50ml', 'Ivory Silk', '05 Terra'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INVENTORY LEDGER, WISHLIST & REVIEWS (002, 003)
-- ============================================================
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  change_quantity INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'RESERVATION_RELEASE')),
  reference_id UUID,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_id)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, variant_id)
);

-- ============================================================
-- 4. COMMERCE: SHIPPING, TAXES, ORDERS, COUPONS (003, 008, 009)
-- ============================================================
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_ghs NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_zar NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
  free_over_ngn NUMERIC(12,2),
  free_over_usd NUMERIC(12,2),
  free_over_eur NUMERIC(12,2),
  free_over_gbp NUMERIC(12,2),
  free_over_ghs NUMERIC(12,2),
  free_over_zar NUMERIC(12,2),
  free_over_kes NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  state TEXT,
  rate NUMERIC(5,4) NOT NULL CHECK (rate >= 0),
  is_inclusive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_subtotal_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_ghs NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_zar NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_subtotal_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount_usd NUMERIC(12,2),
  usage_limit INT,
  times_used INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES')),
  initial_balance NUMERIC(12,2) NOT NULL CHECK (initial_balance > 0),
  current_balance NUMERIC(12,2) NOT NULL CHECK (current_balance >= 0),
  recipient_email TEXT NOT NULL,
  sender_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'disabled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES')),
  subtotal NUMERIC(12,2) NOT NULL,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_card_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('stripe', 'paystack', 'free')),
  payment_reference TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'partially_fulfilled', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- 5. CMS, APP SETTINGS, MARKETING & BANNERS (004, 010, 014)
-- ============================================================
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active Singleton Keys in app_settings:
-- 'store': {"name": "Letty", "tagline": "Atelier of quiet luxury"}
-- 'ugc_videos': JSON Array of active video reels, posters, handles, product links
-- 'shipping': {"default_zone": "NG", "fallback_rate_usd": 15, "fallback_rate_ngn": 12000}
-- 'marketing': {"welcome_discount_pct": 10, "abandoned_cart_after_hours": 24}

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'footer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  cart_payload JSONB NOT NULL,
  recovery_token TEXT UNIQUE NOT NULL,
  recovered_at TIMESTAMPTZ,
  notification_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_metrics (
  metric_date DATE PRIMARY KEY,
  total_orders INT NOT NULL DEFAULT 0,
  total_revenue_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue_ngn NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue_gbp NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  abandoned_carts INT NOT NULL DEFAULT 0
);
```

---

## 6. Atomic Stored Procedures & Transaction Engine

### 6.1 `reserve_inventory`
Atomically verifies stock sufficiency, increments `reserved_quantity`, decrements `stock_quantity`, and creates an immutable ledger entry.

```sql
CREATE OR REPLACE FUNCTION reserve_inventory(p_order_id UUID, p_items JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
  var_id UUID;
  qty INT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    var_id := (item->>'variant_id')::uuid;
    qty := (item->>'quantity')::int;
    
    UPDATE product_variants
    SET stock_quantity = stock_quantity - qty,
        reserved_quantity = reserved_quantity + qty
    WHERE id = var_id AND stock_quantity >= qty;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for variant ID %', var_id;
    END IF;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (var_id, -qty, 'SALE', p_order_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 `commit_inventory` & `release_inventory`
- **`commit_inventory(p_reference TEXT)`**: Commits the reservation once payment webhook confirms success. Decrements `reserved_quantity`.
- **`release_inventory(p_order_id UUID)`**: Reverts the reservation on payment failure or timeout, restoring `stock_quantity` and logging `RESERVATION_RELEASE`.

```sql
CREATE OR REPLACE FUNCTION commit_inventory(p_reference TEXT)
RETURNS VOID AS $$
DECLARE
  v_order UUID;
  v_item RECORD;
BEGIN
  SELECT id INTO v_order FROM orders WHERE payment_reference = p_reference;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found for reference %', p_reference; END IF;

  FOR v_item IN SELECT variant_id, quantity FROM order_items WHERE order_id = v_order
  LOOP
    UPDATE product_variants
    SET reserved_quantity = GREATEST(reserved_quantity - v_item.quantity, 0)
    WHERE id = v_item.variant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Frontend Storefront Architecture

### 7.1 Page Routing Map (`frontend/src/app/`)

```
frontend/src/app/
├── page.tsx                     # Luxury Editorial Homepage
├── about/page.tsx               # Brand Heritage & Philosophy
├── story/page.tsx               # Atelier & Craft Story
├── faq/page.tsx                 # Interactive FAQ with real-time search & categories
├── contact/page.tsx             # Concierge inquiry form + DB capture
├── login/page.tsx               # Customer Account Portal & Auth (Login / Signup)
├── search/page.tsx              # Full catalog search with live filters
├── shop/page.tsx                # Universal shop with dynamic multi-faceted filter sidebar
├── wishlist/page.tsx            # Saved items drawer & standalone page
├── cart/page.tsx                # Full-screen luxury cart manager
├── checkout/page.tsx            # Multi-currency checkout flow (Stripe/Paystack)
├── checkout/success/page.tsx    # Order confirmed receipt & shipment timeline
├── collections/
│   ├── page.tsx                 # Collection catalog
│   └── [slug]/page.tsx          # Dedicated curation (The Edit, Golden Hour, etc.)
├── departments/
│   └── [slug]/page.tsx          # 4 Core Luxury Department storefronts (Beauty, Fashion, Fragrance, Eyewear)
└── products/
    └── [slug]/page.tsx          # High-fashion Product Detail Page (PDP) with shade selector & editorial details
```

### 7.2 Storefront Components Suite (`frontend/src/components/`)

- **Interactive UGC Video Reels (`departments/ugc-videos.tsx`)**:
  - Vertical 9:16 reels carousel with mouse drag & touch snap scrolling.
  - Video play/pause toggle with hover preview state machine.
  - Global sound control (mute / unmute toggle) with visual audio wave icon.
  - Real-time scrubbable progress bar with instant seek.
  - Creator handle badge, geolocation tag (`London`, `Paris`, `China`, `Iraq`), and shade tag pill (`05 Terra`, `06 Midas Touch`).
  - Integrated product card drawer and instant "Add to Bag" action.
- **Community Showcase (`departments/community-showcase.tsx`)**:
  - High-fashion editorial masonry layout displaying brand ambassador moments (`/images/letty_community_ambassadors.jpg`).
  - Interactive full-screen Lightbox with rich captions and creator credits.
  - Brand commitment value pillars: *Clean Formulations*, *100% Cruelty-Free*, *Bespoke Shades*, and *Recyclable Glass*.
- **Department Experiences**: `DepartmentHero`, `DepartmentGrid`, `DepartmentRail`, `DepartmentTiles`, `EditorialBreak`, `ShopTheLook`, `FragranceMoods`.
- **Product Experience**: `ProductGallery` (pinch-zoom, multi-angle thumbnails), `PurchasePanel` (sticky cart CTA, shade swatches with hex dots, dual currency converter), `ProductAccordions` (What It Is, What It Does, How To Use, Ingredients, Sustainable Packaging), `ReviewsSection` (verified review badges + dynamic submission modal), `RecentlyViewedDrawer`.
- **Concierge & Site Chrome**:
  - `WhatsAppWidget`: Luxury floating concierge button with direct WhatsApp click-to-chat integration.
  - `Cursor`: Custom magnetic cursor with responsive hover targets.
  - `SmoothScroll`: Lenis inertial scrolling engine.
  - `Logo`: Theme-aware vector lockup with automatic light/dark switching.
  - `AnnouncementBar`, `Header`, `MegaMenuPanel`, `MobileNav`, `SearchOverlay`.

---

## 8. Admin Control Center Architecture (`frontend/src/app/admin/`)

The LETTY administrative dashboard comprises 17 production-ready sub-modules with real-time Server Actions, RBAC authorization, and mutation validation:

```
frontend/src/app/admin/
├── page.tsx                     # KPI Overview Dashboard (Revenue, Orders, Low Stock)
├── analytics/page.tsx           # Multi-currency sales charts, AOV, conversion rates
├── ugc/page.tsx                 # UGC Video Reels Manager (CRUD, active toggle, video preview)
├── products/
│   ├── page.tsx                 # Product catalog table with filters & quick actions
│   ├── new/page.tsx             # Multi-step product creator with variant & shade matrix builder
│   └── [id]/page.tsx            # Detailed product, editorial story & inventory editor
├── orders/
│   ├── page.tsx                 # Order fulfillment queue with status badges
│   └── [id]/page.tsx            # Order detail with fulfillment events, tracking, refund
├── inventory/page.tsx           # Stock management ledger with quick restock dialog
├── customers/
│   ├── page.tsx                 # Customer directory with LTV & order counts
│   └── [id]/page.tsx            # Customer profile, order history, store credit
├── coupons/page.tsx             # Promo codes & discount rule generator
├── gift-cards/page.tsx          # Digital gift card issuance & balance tracker
├── abandoned-carts/page.tsx     # Lost checkout tracking & manual recovery trigger
├── waitlist/page.tsx            # Out-of-stock back-in-stock subscriber lists
├── newsletter/page.tsx          # Email audience list with CSV export
├── banners/page.tsx             # Homepage announcement & campaign banner manager
├── reviews/page.tsx             # User review moderation queue (Approve/Reject)
├── shipping/page.tsx            # Shipping zone & rate configuration
├── tax/page.tsx                 # Country & state tax rules
├── team/page.tsx                # Staff accounts & RBAC role permissions
├── settings/page.tsx            # Store profile, currency defaults, gateway keys
└── notifications/page.tsx       # Live admin alerts (orders, stock warnings)
```

---

## 9. Backend API & Async Microservices (`backend/`)

### 9.1 REST & Server Action Endpoints

```
backend/app/api/
├── health/route.ts              # System health & dependency check
├── ugc/route.ts                 # Public cached endpoint for active UGC video reels (revalidate = 60)
├── admin/                       # JWT-gated admin REST APIs
│   ├── login/route.ts           # Admin login with bcrypt + jose JWT issuance
│   ├── me/route.ts              # Current admin identity & role payload
│   ├── ugc/route.ts             # Admin UGC Video Reels CRUD & position syncing
│   ├── orders/route.ts          # Admin order list & mutations
│   ├── customers/route.ts       # Customer management
│   ├── products/route.ts        # Product creation & variant syncing
│   └── analytics/route.ts       # Aggregated revenue & daily metrics
├── customer/                    # Customer account authentication & profile APIs
│   ├── auth/login/route.ts      # Customer login with password hashing
│   ├── auth/signup/route.ts     # Customer registration with default credit & email
│   ├── orders/route.ts          # Authenticated customer order history
│   └── wishlist/route.ts        # Customer wishlist sync
├── cart/validate/route.ts       # Pre-checkout live pricing & stock verification
├── checkout/
│   ├── init/route.ts            # Order creation & atomic stock reservation
│   ├── verify/route.ts          # Manual verification fallback
│   └── webhooks/
│       ├── stripe/route.ts      # Stripe HMAC signature webhook handler
│       └── paystack/route.ts    # Paystack crypto signature webhook handler
├── coupon/validate/route.ts     # Public coupon validation & calculation
├── giftcard/validate/route.ts   # Public gift card balance check
├── contact/route.ts             # Contact inquiry submission & notifications
├── newsletter/route.ts          # Newsletter signup with duplicate handling
├── waitlist/route.ts            # Stock alert subscription
└── jobs/                        # QStash Async Processing Workers
    ├── post-payment/route.ts    # Payment success pipeline: commit stock, email, Algolia
    ├── abandoned-cart/route.ts  # 24h & 48h recovery email automation
    ├── inventory-sync/route.ts  # Nightly reconciliation of stock ledgers
    └── algolia-reindex/route.ts # Full reindex of catalog products
```

### 9.2 Payment Gateway Routing (`backend/lib/payments/router.ts`)

```typescript
export type Gateway = 'stripe' | 'paystack' | 'free';

export function selectGateway(currency: string, totalAmount: number): Gateway {
  if (totalAmount <= 0) return 'free';

  switch (currency.toUpperCase()) {
    case 'NGN':
    case 'GHS':
    case 'ZAR':
    case 'KES':
      return 'paystack';
    case 'USD':
    case 'EUR':
    case 'GBP':
    default:
      return 'stripe';
  }
}
```

---

## 10. Role-Based Access Control (RBAC) Specification

Edge-compatible authentication via `jose` enforcing 7 hierarchical staff roles across 12 granular permissions:

```typescript
// backend/lib/auth/rbac.ts
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],
  admin: ['*'],
  manager: [
    'read', 'update', 'create',
    'manage_products', 'manage_orders', 'manage_inventory',
    'manage_customers', 'manage_cms', 'manage_coupons', 'manage_ugc'
  ],
  inventory: [
    'read', 'manage_inventory', 'update_products'
  ],
  support: [
    'read', 'manage_orders', 'manage_reviews', 'view_customers'
  ],
  marketing: [
    'read', 'manage_cms', 'manage_coupons', 'manage_newsletter', 'manage_banners', 'manage_ugc'
  ],
  editor: [
    'read', 'manage_cms', 'update_products', 'manage_ugc'
  ]
};
```

---

## 11. Search Architecture (Algolia v5)

Every product is indexed with rich searchable attributes, luxury faceted filters, and automated webhook synchronization:

```typescript
// backend/lib/algolia.ts
export interface AlgoliaProductRecord {
  objectID: string;
  name: string;
  slug: string;
  tagline?: string;
  brand: string;
  category: string;
  subcategory?: string;
  description: string;
  base_price_usd: number;
  base_price_ngn: number;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  image_url: string;
  variants_count: number;
  in_stock: boolean;
  tags: string[];
}
```

---

## 12. Transactional Email Suite (Resend + React Email)

Branded transactional emails styled in LETTY Warm Cream (`#ede5da`) & Espresso Noir (`#32150d`):

1. **Order Confirmation (`OrderPlacedEmail`)**: Luxury itemized receipt, pricing breakdown, shipping address, and tracking link.
2. **Order Shipped (`OrderShippedEmail`)**: Carrier details, tracking number, and delivery estimates.
3. **Abandoned Cart Recovery (`CartRecoveryEmail`)**: Curated reminder with 1-click cart restore link and optional welcome voucher.
4. **Welcome / Subscriber Gift (`WelcomeEmail`)**: Brand invitation with welcome promo code.

---

## 13. Production Build & Verification

```bash
# Validate Storefront Build (Frontend)
cd frontend
npm run lint
npm run build

# Validate API Service Build (Backend)
cd backend
npm run typecheck
npm run build
```

---

## 14. Architecture Compliance Matrix

| Enterprise Dimension | LETTY v5 Implementation | Status |
| :--- | :--- | :--- |
| **Monorepo Separation** | Decoupled `frontend/` (Port 3000) & `backend/` (Port 4000) | ✅ Complete |
| **Typography Integrity** | Google Fonts: Aboreto & Forum Display Serifs + Tenor Sans UI | ✅ Complete |
| **Luxury Design System**| Warm Cream (`#ede5da`) & Espresso (`#32150d`) tokens with bronze accents | ✅ Complete |
| **Clean Asset Architecture** | Deduplicated media registry with zero unreferenced SVG/PNG files | ✅ Complete |
| **Interactive UGC Reels**| Vertical video reels with play/pause, scrub, audio toggle & bag sync | ✅ Complete |
| **Community Showcase**  | Editorial masonry gallery with high-res lightbox & brand pillars | ✅ Complete |
| **Multi-Currency Engine**| USD, EUR, GBP, NGN, GHS, ZAR, KES across schema & gateways | ✅ Complete |
| **Inventory ACID Safety** | Atomic RPC reservations with immutable ledger logging | ✅ Complete |
| **Dual Payment Gateways**| Stripe (Global) & Paystack (Africa) with webhook validation | ✅ Complete |
| **Admin Control Plane** | 17 Dedicated management modules including UGC & catalog | ✅ Complete |
| **Full-Text Search**    | Algolia v5 integration with incremental mutation webhooks | ✅ Complete |
| **Async Pipelines**     | Upstash QStash queues for post-payment, emails, and syncs | ✅ Complete |
| **Customer Auth Portal** | Next.js 15 customer login/signup with bcrypt & JWT | ✅ Complete |
| **Concierge Service**   | Floating WhatsApp interactive concierge integration | ✅ Complete |

---
*LETTY — Atelier of Quiet Luxury. Engineered for scale, refined for beauty.*