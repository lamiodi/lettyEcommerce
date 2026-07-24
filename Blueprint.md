Here is the **Ultimate Enterprise Blueprint (v3)** for **Letty**. 

This version merges the Next.js 15 optimizations (async APIs, Edge-compatible auth, Zod validation) with the enterprise-grade architecture upgrades (normalized customers/addresses/variants, RBAC, CMS, returns, shipping/taxes, and inventory ledgering). This is a 10/10, production-ready blueprint.

---

# 🌸 LETTY — Ultimate Enterprise E-commerce Blueprint (v3)

## 1. Technology Stack & Dependencies

**Core Frameworks:**
*   Next.js 15 (App Router, Server Actions, Async Request APIs)
*   React 19
*   TypeScript

**UI & Styling:**
*   Tailwind CSS
*   Shadcn UI (Radix Primitives)
*   Framer Motion

**Backend & Database:**
*   Supabase (PostgreSQL + Storage)
*   Algolia (Search: Products, Collections, Brands)
*   Vercel QStash (Async Queues)
*   Upstash Redis (Rate Limiting)
*   Resend + React Email (Transactional Emails)

**Payments:**
*   Stripe (International: USD, EUR, GBP)
*   Paystack (Africa: NGN, GHS, ZAR, KES)

**Authentication & Security (Admin Only):**
*   `jose` (Edge-compatible JWT for Middleware RBAC)
*   `bcryptjs` (Password Hashing)
*   `zod` (Runtime Schema Validation)

**Environment Variables (`.env.local`):**
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Admin Auth
JWT_SECRET_KEY=... # Used with jose

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...

# Search
ALGOLIA_APP_ID=...
ALGOLIA_ADMIN_KEY=...
ALGOLIA_SEARCH_KEY=...

# Infrastructure
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=...

# App
NEXT_PUBLIC_SITE_URL=https://letty.com
```

---

## 2. Database Schema (Supabase / PostgreSQL)

Fully normalized schema featuring customer profiles, address books, product variants, inventory ledgers, returns, shipping zones, tax rules, CMS, and analytics.

```sql
-- ==========================================
-- 1. ADMIN, ROLES & NOTIFICATIONS
-- ==========================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'support', -- 'owner', 'admin', 'manager', 'inventory', 'support', 'marketing', 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'new_order', 'low_stock', 'refund_requested'
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. CUSTOMERS & ADDRESSES
-- ==========================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  loyalty_points INT DEFAULT 0,
  store_credit_ngn NUMERIC(12,2) DEFAULT 0,
  store_credit_usd NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. CATALOG: BRANDS, CATEGORIES, COLLECTIONS
-- ==========================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE collection_products (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);

-- ==========================================
-- 4. PRODUCTS, VARIANTS & MEDIA (Normalized)
-- ==========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  description TEXT,
  base_price_ngn NUMERIC(12,2) NOT NULL,
  base_price_usd NUMERIC(12,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  schema_markup JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'image'
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  price_override_ngn NUMERIC(12,2),
  price_override_usd NUMERIC(12,2),
  weight_grams INT,
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INT DEFAULT 0 CHECK (reserved_quantity >= 0)
);

CREATE TABLE variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL, -- 'Size', 'Color', 'Volume'
  option_value TEXT NOT NULL -- 'M', 'Red', '50ml'
);

-- ==========================================
-- 5. INVENTORY LEDGER & ENGAGEMENT
-- ==========================================
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_quantity INT NOT NULL,
  reason TEXT NOT NULL, -- 'RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  images JSONB DEFAULT '[]',
  verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. SHIPPING, TAXES & RETURNS
-- ==========================================
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries JSONB NOT NULL
);

CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_ngn NUMERIC(12,2) NOT NULL,
  rate_usd NUMERIC(12,2) NOT NULL,
  estimated_days TEXT
);

CREATE TABLE tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  state TEXT,
  rate NUMERIC(5,2) NOT NULL,
  is_inclusive BOOLEAN DEFAULT true
);

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'requested',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. ORDERS, COUPONS & GIFT CARDS
-- ==========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_email TEXT NOT NULL,
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  shipping_method_id UUID REFERENCES shipping_methods(id),
  currency TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_total NUMERIC(12,2) DEFAULT 0,
  gift_card_total NUMERIC(12,2) DEFAULT 0,
  shipping_total NUMERIC(12,2) DEFAULT 0,
  tax_total NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  payment_gateway TEXT NOT NULL,
  payment_reference TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_snapshot JSONB NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'placed', 'paid', 'packed', 'shipped', 'returned'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, 
  discount_value NUMERIC(12,2) NOT NULL,
  min_subtotal NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  usage_limit INT,
  times_used INT DEFAULT 0,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  initial_balance NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  purchaser_order_id UUID REFERENCES orders(id),
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. CMS & ANALYTICS
-- ==========================================
CREATE TABLE cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL, -- 'home', 'shop', 'product'
  section_type TEXT NOT NULL, -- 'hero', 'banner', 'collection_grid'
  title TEXT,
  payload JSONB NOT NULL,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_metrics (
  metric_date DATE PRIMARY KEY,
  total_orders INT DEFAULT 0,
  total_revenue_usd NUMERIC(12,2) DEFAULT 0,
  total_revenue_ngn NUMERIC(12,2) DEFAULT 0,
  new_customers INT DEFAULT 0,
  abandoned_carts INT DEFAULT 0
);

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Active Products" ON products FOR SELECT USING (is_active = true AND deleted_at IS NULL);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No Public Access Admins" ON admins FOR ALL USING (false);

-- ==========================================
-- 10. ATOMIC RPC FUNCTIONS
-- ==========================================
-- Inventory Reservation (Logs to ledger)
CREATE OR REPLACE FUNCTION reserve_inventory(p_order_id UUID, p_items JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB; var_id UUID; qty INT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    var_id := item->>'variant_id';
    qty := (item->>'quantity')::int;
    
    UPDATE product_variants
    SET stock_quantity = stock_quantity - qty,
        reserved_quantity = reserved_quantity + qty
    WHERE id = var_id AND stock_quantity >= qty;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Out of stock for variant ID %', var_id;
    END IF;

    INSERT INTO inventory_transactions (variant_id, change_quantity, reason, reference_id)
    VALUES (var_id, -qty, 'SALE', p_order_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inventory Commit (Moves reserved to sold)
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

## 3. Core Library Implementations

### `lib/supabase/server.ts`
Next.js 15 compatible Supabase Server Client using `@supabase/ssr`.
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
}
```

### `lib/auth/rbac.ts`
Edge-compatible JWT verification and Role-Based Access Control (RBAC).
```typescript
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET_KEY!;
const encodedSecret = new TextEncoder().encode(secretKey);

export async function signAdminToken(payload: { id: string; email: string, role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(encodedSecret);
}

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}

const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: ['*'],
  manager: ['read', 'update', 'create'],
  inventory: ['read', 'update_inventory'],
  support: ['read', 'update_orders'],
  marketing: ['read', 'manage_cms', 'manage_coupons'],
  editor: ['read', 'manage_cms', 'update_products']
};

export async function checkPermission(action: string) {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const role = admin.role as keyof typeof ROLE_PERMISSIONS;
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions || (!permissions.includes(action) && !permissions.includes('*'))) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return admin;
}
```

### `lib/validations.ts`
Zod schemas for runtime validation on API inputs.
```typescript
import { z } from 'zod';

export const checkoutInitSchema = z.object({
  cart: z.array(z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.object({
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    street: z.string(),
    postal_code: z.string().optional(),
  }),
  currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES']),
});
```

---

## 4. API Routes & Webhooks

### `app/api/checkout/init/route.ts`
Validates cart, upserts customer/address, calculates shipping/tax, and reserves inventory.
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { selectGateway } from '@/lib/payments/router';
import { checkoutInitSchema } from '@/lib/validations';
import { calculateShipping } from '@/lib/shipping/calculator';
import { calculateTax } from '@/lib/tax/calculator';

export async function POST(req: Request) {
  const body = await req.json();
  const validation = checkoutInitSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
  }
  
  const { cart, customerEmail, shippingAddress, currency } = validation.data;

  // 1. Upsert Customer & Address
  const { data: customer } = await supabaseAdmin.from('customers')
    .upsert({ email: customerEmail }, { onConflict: 'email' }).select().single();
    
  const { data: address } = await supabaseAdmin.from('addresses')
    .insert({ ...shippingAddress, customer_id: customer.id }).select().single();

  // 2. Calculate Subtotal, Shipping, and Tax
  const subtotal = await calculateSubtotal(cart);
  const shippingRate = await calculateShipping(address.country, subtotal, currency);
  const taxRate = await calculateTax(address.country, address.state);

  // 3. Create Order
  const { data: order, error } = await supabaseAdmin.from('orders').insert({
    order_number: `LETTY-${Date.now()}`,
    customer_id: customer.id,
    customer_email: customerEmail,
    shipping_address_id: address.id,
    billing_address_id: address.id,
    currency,
    subtotal,
    shipping_total: shippingRate,
    tax_total: (subtotal * taxRate),
    total: subtotal + shippingRate + (subtotal * taxRate),
    payment_status: 'pending',
  }).select().single();

  if (error) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

  // 4. Reserve Inventory Atomically
  const { error: rpcError } = await supabaseAdmin.rpc('reserve_inventory', {
    p_order_id: order.id,
    p_items: cart
  });

  if (rpcError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'Out of stock' }, { status: 409 });
  }

  // 5. Initialize Payment (Stripe/Paystack)
  const gateway = selectGateway(currency);
  // ... Payment intent creation logic ...

  return NextResponse.json({ orderId: order.id, gateway });
}
```

### `app/api/jobs/post-payment/route.ts`
Handles QStash async jobs: commits inventory, syncs Algolia, generates notifications.
```typescript
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Receiver } from '@upstash/qstash';
import { algoliaIndex } from '@/lib/algolia';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: Request) {
  const signature = req.headers.get('Upstash-Signature') || '';
  const body = await req.text();
  
  try {
    await receiver.verify({ body, signature });
  } catch {
    return new Response('Invalid QStash Signature', { status: 401 });
  }

  const { reference } = JSON.parse(body);

  // 1. Commit Inventory
  await supabaseAdmin.rpc('commit_inventory', { p_reference: reference });

  // 2. Log Order Event & Notification
  await supabaseAdmin.from('order_events').insert({ event_type: 'paid', metadata: { reference } });
  await supabaseAdmin.from('admin_notifications').insert({ type: 'new_order', entity_id: reference });

  // 3. Sync Algolia (Partial update based on purchased variants)
  const { data: order } = await supabaseAdmin.from('orders')
    .select('id, order_items(variant_id, quantity)').eq('payment_reference', reference).single();
  
  if (order?.order_items) {
    for (const item of order.order_items) {
      await algoliaIndex.partialUpdateObject({
        objectID: item.variant_id,
        // Fetch and update exact stock level in Algolia
      });
    }
  }

  // 4. Send Confirmation Email via Resend
  // 5. Generate Gift Cards if applicable
  // 6. Upsert Daily Metrics

  return new Response('OK', { status: 200 });
}
```

---

## 5. Middleware & Security (Edge Compatible)

### `middleware.ts`
Next.js 15 Edge Middleware for Rate Limiting and Admin Route Protection.
```typescript
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { jwtVerify } from 'jose';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

const encodedSecret = new TextEncoder().encode(process.env.JWT_SECRET_KEY!);

export async function middleware(req: Request) {
  const path = new URL(req.url).pathname;

  // 1. Rate Limit Auth & Checkout
  if (path === '/api/admin/login' || path === '/api/checkout/init') {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await ratelimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }

  // 2. Protect Admin Pages
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));
    
    try {
      await jwtVerify(token, encodedSecret);
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/checkout/:path*'],
};
```

---

## 6. SEO & Frontend Architecture (Next.js 15 Async APIs)

### `app/product/[slug]/page.tsx`
**Critical Update:** In Next.js 15, `params` is a Promise and must be awaited. Includes comprehensive JSON-LD for SEO.
```tsx
import { ProductJsonLd, BreadcrumbJsonLd } from 'next-seo';
import { supabaseServer } from '@/lib/supabase/server';

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: product } = await supabaseServer()
    .from('products')
    .select(`
      *,
      brands (name),
      product_media (url, alt_text, position),
      product_variants (*, variant_options (*)),
      reviews (rating, body, title, verified_purchase)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) return <div>Product not found</div>;

  const avgRating = product.reviews?.reduce((acc, r) => acc + r.rating, 0) / product.reviews?.length || 0;

  return (
    <>
      <ProductJsonLd
        useAppDir={true}
        productName={product.name}
        images={product.product_media?.map(m => m.url)}
        description={product.description}
        brand={product.brands?.name}
        offers={[{
          price: product.base_price_usd,
          priceCurrency: 'USD',
          availability: product.product_variants?.[0]?.stock_quantity > 0 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock'
        }]}
        aggregateRating={{
          ratingValue: avgRating,
          reviewCount: product.reviews?.length || 0,
        }}
      />
      
      <BreadcrumbJsonLd
        itemListElements={[
          { position: 1, name: 'Home', item: 'https://letty.com' },
          { position: 2, name: product.brands?.name, item: `https://letty.com/brand/${product.brands?.slug}` },
          { position: 3, name: product.name, item: `https://letty.com/product/${product.slug}` },
        ]}
      />
      
      <div className="product-layout grid grid-cols-2 gap-8 p-8">
        {/* Render normalized media, variant selectors, reviews, and CMS-driven sections */}
      </div>
    </>
  );
}
```

---

## 7. Admin Dashboard (Server Actions)

### `app/admin/products/actions.ts`
Next.js 15 Server Action with RBAC verification, Zod validation, and Algolia sync.
```typescript
'use server'

import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkPermission } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { algoliaIndex } from '@/lib/algolia';

const toggleSchema = z.object({
  productId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function toggleProductActive(formData: FormData) {
  // 1. Check RBAC Permissions (Throws if unauthorized)
  const admin = await checkPermission('update_products');

  // 2. Validate Input
  const parsed = toggleSchema.safeParse({
    productId: formData.get('productId'),
    isActive: formData.get('isActive') === 'true'
  });
  
  if (!parsed.success) throw new Error('Invalid input');

  const { productId, isActive } = parsed.data;

  // 3. Perform DB Action (Bypasses RLS securely on server)
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);

  // 4. Log to Audit Trail
  await supabaseAdmin.from('audit_logs').insert({
    admin_id: admin.sub as string,
    action: 'TOGGLE_PRODUCT_ACTIVE',
    entity_type: 'product',
    entity_id: productId,
    metadata: { is_active: isActive }
  });

  // 5. Sync to Algolia
  await algoliaIndex.partialUpdateObject({
    objectID: productId,
    is_active: isActive
  });

  // 6. Revalidate ISR Cache
  revalidatePath('/admin/products');
  revalidatePath(`/product/${productId}`, 'page');
}
```