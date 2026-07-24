/**
 * Centralized Zod schemas for runtime validation.
 * Use these in API route handlers, server actions, and webhook signatures.
 */
import { z } from "zod";

/* ----------------------------------------------------------------- */
/*  Primitives                                                         */
/* ----------------------------------------------------------------- */

export const uuid = z.string().uuid();
export const email = z.string().email().max(254);
export const phone = z
  .string()
  .min(7)
  .max(20)
  .regex(/^[+0-9()\-\s]+$/, "Invalid phone number");

export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "GHS",
  "ZAR",
  "KES",
] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const ISO_COUNTRY = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, "Country must be ISO-3166-1 alpha-2");

/* ----------------------------------------------------------------- */
/*  Address                                                            */
/* ----------------------------------------------------------------- */

export const addressSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  phone: phone,
  country: ISO_COUNTRY,
  state: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  street: z.string().min(1).max(200),
  postal_code: z.string().max(20).optional().nullable(),
  label: z.string().max(40).optional().nullable(),
  is_default_shipping: z.boolean().optional().default(false),
  is_default_billing: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

/* ----------------------------------------------------------------- */
/*  Cart / Checkout                                                    */
/* ----------------------------------------------------------------- */

export const cartItemSchema = z.object({
  variant_id: uuid,
  quantity: z.number().int().positive().max(99),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutInitSchema = z.object({
  cart: z.array(cartItemSchema).min(1).max(50),
  customerEmail: email,
  customerPhone: phone.optional(),
  customerFirstName: z.string().min(1).max(80).optional(),
  customerLastName: z.string().min(1).max(80).optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  billingSameAsShipping: z.boolean().optional().default(true),
  currency: currencySchema,
  shippingMethodId: uuid.optional(),
  couponCode: z.string().min(1).max(64).optional(),
  giftCardCode: z.string().min(1).max(64).optional(),
  notes: z.string().max(1000).optional(),
});
export type CheckoutInitInput = z.infer<typeof checkoutInitSchema>;

export const checkoutVerifySchema = z.object({
  reference: z.string().min(1).max(120),
  gateway: z.enum(["stripe", "paystack"]),
});
export type CheckoutVerifyInput = z.infer<typeof checkoutVerifySchema>;

/* ----------------------------------------------------------------- */
/*  Coupons & Gift Cards                                               */
/* ----------------------------------------------------------------- */

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(64),
  subtotal: z.number().nonnegative(),
  currency: currencySchema,
  customerId: uuid.optional(),
});
export const giftCardValidateSchema = z.object({
  code: z.string().min(1).max(64),
  currency: currencySchema,
});

/* ----------------------------------------------------------------- */
/*  Products / Catalog                                                 */
/* ----------------------------------------------------------------- */

export const productListSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  category: z.string().optional(),
  brand: z.string().optional(),
  collection: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "featured", "rating"])
    .default("featured"),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
});
export type ProductListInput = z.infer<typeof productListSchema>;

export const productCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, hyphen-separated"),
  name: z.string().min(1).max(200),
  brand_id: uuid.optional().nullable(),
  category_id: uuid.optional().nullable(),
  description: z.string().optional().nullable(),
  short_description: z.string().max(400).optional().nullable(),
  base_price_ngn: z.number().nonnegative(),
  base_price_usd: z.number().nonnegative(),
  compare_at_price_ngn: z.number().nonnegative().optional().nullable(),
  compare_at_price_usd: z.number().nonnegative().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(400).optional().nullable(),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const variantCreateSchema = z.object({
  product_id: uuid,
  sku: z.string().min(1).max(80),
  barcode: z.string().max(80).optional().nullable(),
  price_override_ngn: z.number().nonnegative().optional().nullable(),
  price_override_usd: z.number().nonnegative().optional().nullable(),
  weight_grams: z.number().int().nonnegative().optional().nullable(),
  stock_quantity: z.number().int().nonnegative().default(0),
  low_stock_threshold: z.number().int().nonnegative().default(5),
  is_active: z.boolean().default(true),
  options: z
    .array(
      z.object({
        option_name: z.string().min(1).max(40),
        option_value: z.string().min(1).max(80),
      }),
    )
    .max(5)
    .default([]),
});
export type VariantCreateInput = z.infer<typeof variantCreateSchema>;

/* ----------------------------------------------------------------- */
/*  Admin / Auth                                                       */
/* ----------------------------------------------------------------- */

export const adminLoginSchema = z.object({
  email: email,
  password: z.string().min(8).max(128),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminCreateSchema = z.object({
  email: email,
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(120).optional(),
  role: z.enum([
    "owner",
    "admin",
    "manager",
    "inventory",
    "support",
    "marketing",
    "editor",
  ]),
});

/* ----------------------------------------------------------------- */
/*  Customer                                                           */
/* ----------------------------------------------------------------- */

export const reviewCreateSchema = z.object({
  product_id: uuid,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
  images: z.array(z.string().url()).max(8).default([]),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const waitlistJoinSchema = z.object({
  email: email,
  variant_id: uuid,
});

export const newsletterSubscribeSchema = z.object({
  email: email,
  source: z.string().max(80).optional(),
});

/* ----------------------------------------------------------------- */
/*  CMS                                                                */
/* ----------------------------------------------------------------- */

export const cmsSectionSchema = z.object({
  page_type: z.enum(["home", "shop", "product", "collection", "about", "checkout_success"]),
  section_type: z.enum([
    "hero",
    "banner",
    "collection_grid",
    "editorial",
    "marquee",
    "testimonials",
    "product_rail",
    "category_rail",
    "rich_text",
    "newsletter",
    "announcement",
  ]),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(400).optional().nullable(),
  payload: z.record(z.string(), z.unknown()).default({}),
  position: z.number().int().default(0),
  is_active: z.boolean().default(true),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
});
export type CmsSectionInput = z.infer<typeof cmsSectionSchema>;

/* ----------------------------------------------------------------- */
/*  Settings                                                           */
/* ----------------------------------------------------------------- */

export const settingUpsertSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
  description: z.string().max(400).optional().nullable(),
});
