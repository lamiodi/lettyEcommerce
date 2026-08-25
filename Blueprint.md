# 🌸 LETTY — Ultimate Enterprise E-commerce Blueprint (v4)

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
│ • Satoshi & Zodiak Custom Typography   │ • 14 Database Migrations (000 → 014)    │
│ • Lenis Smooth Scroll + Framer Motion  │ • Atomic RPC Inventory & Ledger Engine  │
│ • Centralized Image Registry System    │ • Dual Payments: Stripe + Paystack      │
│ • Zustand Client Stores (Cart/Wishlist)│ • Algolia v5 Full-Text Search Engine    │
│ • 5 Luxury Department Storefronts      │ • Upstash QStash Async Job Queues       │
│ • 16+ Full-Featured Admin Pages        │ • Upstash Redis Rate Limiting & Caching │
│ • Next-Gen JSON-LD & Dynamic SEO       │ • Resend + React Email Luxury Templates │
│ • Dual-Currency (NGN/USD/EUR/GBP/etc.) │ • 7-Role Edge RBAC Permission Matrix    │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Technology Stack & Package Ecosystem

### 2.1 Storefront (`frontend/`)

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js `15.5.21` (App Router, Turbopack) | Server Components, Streaming, Async Request APIs, ISR |
| **Runtime** | React `19.1.0` + TypeScript `5.x` | Modern reactive UI, strict static type safety |
| **Styling** | Tailwind CSS `v4` + `@tailwindcss/postcss` | High-performance CSS-first styling engine |
| **Primitives** | Radix UI / Shadcn Primitives + `@base-ui/react` | Accessible headless UI foundation (Dialog, Accordion, etc.) |
| **Motion** | Framer Motion `12.42.2` | Editorial page reveals, staggered transitions, hover micro-interactions |
| **Smooth Scroll** | Lenis `1.3.25` | Momentum-based luxury viewport scrolling |
| **Carousels** | Embla Carousel React `8.6.0` | Touch-friendly editorial product rails & collection sliders |
| **State** | Zustand `5.0.14` | Persistent client state for Cart, Wishlist, Recently Viewed |
| **Notifications** | Sonner `2.0.7` | Luxury floating toast alerts |
| **Typography** | Satoshi Variable & Zodiak Variable | Custom high-fashion fonts loaded locally |

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
| **Auth & Security** | `jose` `5.9.6` + `bcryptjs` `2.4.3` | Edge-compatible JWT verification & password hashing |
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

# Admin Edge Auth
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

LETTY employs a deliberate editorial typography pairing that evokes modern high-fashion luxury:

```
┌───────────────────────────┬────────────────────────────────────────────────────────┐
│ Font Family               │ Application & Role                                     │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Zodiak Variable           │ Editorial Display Serif — Page titles, hero statements,│
│ (Local variable font)     │ collection names, quote callouts, department doors.    │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Satoshi Variable          │ Geometric Sans-Serif — Product titles, UI labels,      │
│ (Local variable font)     │ body copy, pricing, navigation links, button text.     │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ Playfair Display / Inter  │ Universal web-font fallbacks in global styles.         │
└───────────────────────────┴────────────────────────────────────────────────────────┘
```

### 4.2 Luxury Color Palette & Design Tokens

```css
/* LETTY Color System */
--color-bg: #F8F6F2;         /* Warm Alabaster: Rich, calm canvas */
--color-surface: #FFFFFF;    /* Pure White: Product cards, modals, sheets */
--color-primary: #111111;    /* Atelier Noir: Deepest obsidian for headings/CTAs */
--color-secondary: #5C5C5C;  /* Muted Slate: Subtitles, metadata, secondary copy */
--color-accent: #D8B98A;     /* Champagne Gold: Luxury accents, badges, highlights */
--color-border: #ECECEC;     /* Soft Linen: Hairline separators and outlines */
--color-surface-hover: #F2EFE9; /* Subtle warm tint on interactive hover */
```

### 4.3 UI Directives & Visual Guidelines
- **Border Radius**: Consistent `12px` (`rounded-xl` / `rounded-2xl`) for product cards, input boxes, and buttons.
- **Elevation**: Soft, diffuse shadows (`shadow-sm`, `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
- **Forbidden Patterns**: No glassmorphism, no neumorphism, no aggressive neon gradients, no generic stock placeholders.
- **Motion & Micro-interactions**: Lenis inertial scrolling, smooth text-mask reveal animations, magnetic cursor transitions, subtle image scale on hover (`scale-105 transition-transform duration-700`).

### 4.4 Centralized Image Registry System (`frontend/src/lib/images.ts`)
To allow seamless asset swapping without altering UI layouts:
- All assets are registered under strongly typed semantic keys (`deptMakeupHero`, `deptFashionHero`, `tileSkincare`, `fragranceAmber`, etc.).
- Wrapped in the unified `<LettyImage />` component with built-in aspect-ratio preservation, responsive `sizes` definitions, and graceful fallbacks.

---

## 5. Complete Database Schema (Supabase / PostgreSQL)

Representing the complete 14-migration architecture (`supabase/migrations/000` through `014`):

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
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
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

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  is_default_shipping BOOLEAN NOT NULL DEFAULT false,
  is_default_billing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CATALOG HIERARCHY & MULTI-CURRENCY (002, 008)
-- ============================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_products (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_slug TEXT,
  description TEXT,
  short_description TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  ingredients TEXT,
  -- Multi-Currency Base Prices
  base_price_ngn NUMERIC(12,2) NOT NULL CHECK (base_price_ngn >= 0),
  base_price_usd NUMERIC(12,2) NOT NULL CHECK (base_price_usd >= 0),
  base_price_eur NUMERIC(12,2) CHECK (base_price_eur >= 0),
  base_price_gbp NUMERIC(12,2) CHECK (base_price_gbp >= 0),
  base_price_ghs NUMERIC(12,2) CHECK (base_price_ghs >= 0),
  base_price_zar NUMERIC(12,2) CHECK (base_price_zar >= 0),
  base_price_kes NUMERIC(12,2) CHECK (base_price_kes >= 0),
  -- Compare At Prices (Strikethrough)
  compare_at_price_ngn NUMERIC(12,2),
  compare_at_price_usd NUMERIC(12,2),
  compare_at_price_eur NUMERIC(12,2),
  compare_at_price_gbp NUMERIC(12,2),
  compare_at_price_ghs NUMERIC(12,2),
  compare_at_price_zar NUMERIC(12,2),
  compare_at_price_kes NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  schema_markup JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_media (
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
  option_value TEXT NOT NULL, -- '50ml', 'Ivory Silk', '01 Golden Noir'
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
  -- Multi-Currency Rates & Free Shipping Thresholds
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

CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID,
  amount NUMERIC(12,2) NOT NULL,
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

CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'placed', 'paid', 'packed', 'shipped', 'delivered', 'returned'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'refunded')),
  reason TEXT NOT NULL,
  refund_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. CMS, SETTINGS, MARKETING & METRICS (004, 010, 012, 013, 014)
-- ============================================================
CREATE TABLE cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,    -- 'home', 'department', 'story', 'collection'
  section_type TEXT NOT NULL, -- 'hero', 'doorway', 'editorial_break', 'banner', 'product_rail'
  title TEXT,
  payload JSONB NOT NULL,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
├── search/page.tsx              # Full catalog search with live filters
├── shop/page.tsx                # Universal shop with dynamic multi-faceted filter sidebar
├── wishlist/page.tsx            # Saved items drawer & standalone page
├── cart/page.tsx                # Full-screen luxury cart manager
├── checkout/page.tsx            # Multi-currency checkout flow (Stripe/Paystack)
├── checkout/success/page.tsx    # Order confirmed receipt & shipment timeline
├── collections/
│   ├── page.tsx                 # Collection catalog
│   └── [slug]/page.tsx          # Dedicated curation (Beauty Edit, Bridal, etc.)
├── departments/
│   └── [slug]/page.tsx          # 5 Core Luxury Department storefronts
└── products/
    └── [slug]/page.tsx          # High-fashion Product Detail Page (PDP)
```

### 7.2 Storefront Components Suite (`frontend/src/components/`)

- **Home Experience**: `Hero`, `WorldsDoorway`, `ProductRail`, `EditorialBreak`, `TrustBar`, `WhyLetty`, `InstagramFeed`, `Newsletter`, `Footer`.
- **Departments**: `DepartmentHero`, `EditorialBreak`, `ShopTheLook` (interactive image hotspot coordinates), `FragranceMoods`, `DepartmentTiles`.
- **Product Experience**: `ProductGallery` (pinch-zoom, multi-angle thumbnails), `PurchasePanel` (sticky cart CTA, shade/size swatches, dual currency converter), `ProductAccordions` (Ingredients, Ritual, Sustainable Packaging, Shipping/Returns), `ReviewsSection` (verified review badges + dynamic submission modal), `RecentlyViewedDrawer`.
- **Commerce**: `CartDrawer`, `CartLineItem`, `CouponInput`, `GiftCardRedeem`, `PaymentGatewaySelector`, `OrderSummaryPanel`.
- **Site Chrome**: `AnnouncementBar`, `Header`, `MegaMenuPanel`, `MobileNav`, `SearchOverlay`, `ScrollProgress`, `SmoothScroll` (Lenis engine).

---

## 8. Admin Control Center Architecture (`frontend/src/app/admin/`)

The LETTY administrative dashboard comprises 16+ production-ready sub-modules with real-time Server Actions, RBAC authorization, and mutation validation:

```
frontend/src/app/admin/
├── page.tsx                     # KPI Overview Dashboard (Revenue, Orders, Low Stock)
├── analytics/page.tsx           # Multi-currency sales charts, AOV, conversion rates
├── products/
│   ├── page.tsx                 # Product catalog table with filters & quick actions
│   ├── new/page.tsx             # Multi-step product creator with variant matrix builder
│   └── [id]/page.tsx            # Detailed product & inventory editor
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
├── admin/                       # JWT-gated admin REST APIs
│   ├── login/route.ts           # Admin login with bcrypt + jose JWT issuance
│   ├── me/route.ts              # Current admin identity & role payload
│   ├── orders/route.ts          # Admin order list & mutations
│   ├── customers/route.ts       # Customer management
│   ├── products/route.ts        # Product creation & variant syncing
│   └── analytics/route.ts       # Aggregated revenue & daily metrics
├── cart/validate/route.ts       # Pre-checkout live pricing & stock verification
├── checkout/
│   ├── init/route.ts            # Order creation & atomic stock reservation
│   ├── verify/route.ts          # Manual verification fallback
│   └── webhooks/
│       ├── stripe/route.ts      # Stripe HMAC signature webhook handler
│       └── paystack/route.ts    # Paystack crypto signature webhook handler
├── coupon/validate/route.ts     # Public coupon validation & calculation
├── giftcard/validate/route.ts   # Public gift card balance check
├── customer/                    # Authenticated customer endpoints
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
    'manage_customers', 'manage_cms', 'manage_coupons'
  ],
  inventory: [
    'read', 'manage_inventory', 'update_products'
  ],
  support: [
    'read', 'manage_orders', 'manage_reviews', 'view_customers'
  ],
  marketing: [
    'read', 'manage_cms', 'manage_coupons', 'manage_newsletter', 'manage_banners'
  ],
  editor: [
    'read', 'manage_cms', 'update_products'
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

- **Searchable Attributes**: `name`, `brand`, `tagline`, `category`, `description`.
- **Facet Filters**: `category`, `subcategory`, `brand`, `in_stock`, `base_price_usd`.
- **Ranking**: `typo`, `geo`, `words`, `filters`, `proximity`, `attribute`, `exact`, `custom(rating, is_featured)`.

---

## 12. Transactional Email Suite (Resend + React Email)

Branded transactional emails styled in LETTY Alabaster & Noir:

1. **Order Confirmation (`OrderPlacedEmail`)**: Luxury itemized receipt, pricing breakdown, shipping address, and tracking link.
2. **Order Shipped (`OrderShippedEmail`)**: Carrier details, tracking number, and delivery estimates.
3. **Abandoned Cart Recovery (`CartRecoveryEmail`)**: Curated reminder with 1-click cart restore link and optional welcome voucher.
4. **Welcome / Subscriber Gift (`WelcomeEmail`)**: Brand invitation with welcome promo code.

---

## 13. Production Deployment & Verification Runbook

### 13.1 Local Development
```bash
# Terminal 1 — Frontend (Port 3000)
cd frontend
npm install
npm run dev

# Terminal 2 — Backend (Port 4000)
cd backend
npm install
npm run dev
```

### 13.2 Database Migration & Seeding
```bash
cd backend
npm run db:migrate  # Runs SQL migrations 000 through 014
npm run db:seed     # Seeds initial luxury catalog, staff roles, and settings
```

### 13.3 Production Build Verification
```bash
# Validate Storefront Build
cd frontend
npm run lint
npm run build

# Validate Backend Microservice Build
cd backend
npm run typecheck
npm run build
```

---

## 14. Architecture Compliance Matrix

| Enterprise Dimension | LETTY v4 Implementation | Status |
| :--- | :--- | :--- |
| **Monorepo Separation** | Decoupled `frontend/` (Port 3000) & `backend/` (Port 4000) | ✅ Complete |
| **Typography Integrity** | Satoshi Variable & Zodiak Variable local font engines | ✅ Complete |
| **Image Decoupling** | Centralized `IMAGES` registry with `<LettyImage />` component | ✅ Complete |
| **Multi-Currency** | USD, EUR, GBP, NGN, GHS, ZAR, KES across schema & payments | ✅ Complete |
| **Inventory ACID Safety** | Atomic RPC reservations with immutable ledger logging | ✅ Complete |
| **Dual Payment Gateways** | Stripe (Global) & Paystack (Africa) with webhook validation | ✅ Complete |
| **Admin Control Plane** | 16+ Dedicated management pages with Server Actions & RBAC | ✅ Complete |
| **Full-Text Search** | Algolia v5 integration with incremental mutation webhooks | ✅ Complete |
| **Async Pipelines** | Upstash QStash queues for post-payment, emails, and syncs | ✅ Complete |
| **Security & Defense** | Upstash Redis sliding-window rate limiting & Jose JWT auth | ✅ Complete |

---
*LETTY — Atelier of Quiet Luxury. Engineered for scale, refined for beauty.*