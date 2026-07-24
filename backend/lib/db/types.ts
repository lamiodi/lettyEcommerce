/**
 * Database row types — single source of truth, inferred from Supabase helpers.
 *
 * Since we use the plain `createClient` (not the typegen SDK), we model these
 * here. Keep this file in sync with `supabase/migrations/00x_*.sql`.
 */

export type UUID = string;
export type ISO8601 = string;
export type Money = number;

export type AdminRole =
  | "owner"
  | "admin"
  | "manager"
  | "inventory"
  | "support"
  | "marketing"
  | "editor";

export interface Admin {
  id: UUID;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: ISO8601 | null;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface Customer {
  id: UUID;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  marketing_consent: boolean;
  loyalty_points: number;
  store_credit_ngn: Money;
  store_credit_usd: Money;
  total_spent_ngn: Money;
  total_spent_usd: Money;
  last_order_at: ISO8601 | null;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface Address {
  id: UUID;
  customer_id: UUID;
  label: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  street: string;
  postal_code: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface Brand {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface Category {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  position: number;
  parent_id: UUID | null;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface Collection {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  position: number;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface ProductMedia {
  id: UUID;
  product_id: UUID;
  url: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  type: "image" | "video";
  created_at: ISO8601;
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  sku: string;
  barcode: string | null;
  price_override_ngn: Money | null;
  price_override_usd: Money | null;
  weight_grams: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  position: number;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface VariantOption {
  id: UUID;
  variant_id: UUID;
  option_name: string;
  option_value: string;
}

export interface Product {
  id: UUID;
  slug: string;
  name: string;
  brand_id: UUID | null;
  category_id: UUID | null;
  description: string | null;
  short_description: string | null;
  base_price_ngn: Money;
  base_price_usd: Money;
  compare_at_price_ngn: Money | null;
  compare_at_price_usd: Money | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  deleted_at: ISO8601 | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  schema_markup: Record<string, unknown>;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type FulfillmentStatus =
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "returned"
  | "cancelled";

export interface Order {
  id: UUID;
  order_number: string;
  customer_id: UUID | null;
  customer_email: string;
  customer_phone: string | null;
  shipping_address_id: UUID | null;
  billing_address_id: UUID | null;
  shipping_method_id: UUID | null;
  currency: string;
  subtotal: Money;
  discount_total: Money;
  gift_card_total: Money;
  shipping_total: Money;
  tax_total: Money;
  total: Money;
  coupon_id: UUID | null;
  gift_card_id: UUID | null;
  payment_gateway: "stripe" | "paystack";
  payment_reference: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  notes: string | null;
  internal_notes: string | null;
  created_at: ISO8601;
  updated_at: ISO8601;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  variant_id: UUID;
  product_snapshot: Record<string, unknown>;
  quantity: number;
  unit_price: Money;
  line_total: Money;
  fulfilled_quantity: number;
}
