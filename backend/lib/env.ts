/**
 * Centralized, type-safe environment variable access.
 * Throws a single, descriptive error if a required value is missing.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  NEXT_PUBLIC_SITE_URL: z.string().url(),
  FRONTEND_ORIGINS: z.string().default(""),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  JWT_SECRET_KEY: z.string().min(32, "JWT_SECRET_KEY must be at least 32 characters"),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),

  ALGOLIA_APP_ID: z.string().min(1).optional(),
  ALGOLIA_ADMIN_KEY: z.string().min(1).optional(),
  ALGOLIA_SEARCH_KEY: z.string().min(1).optional(),
  ALGOLIA_PRODUCTS_INDEX: z.string().default("letty_products"),
  ALGOLIA_COLLECTIONS_INDEX: z.string().default("letty_collections"),
  ALGOLIA_BRANDS_INDEX: z.string().default("letty_brands"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  QSTASH_TOKEN: z.string().min(1).optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default("LETTY <orders@letty.com>"),
  // Optional override for the recipient of the newOrderAlert admin email.
  // Defaults to the address inside EMAIL_FROM ("orders@letty.com").
  EMAIL_OWNER_ALERT: z.string().email().optional(),

  // Brand assets used inside email templates.
  // - EMAIL_LOGO_URL: absolute URL to the emblem (HTTPS; some clients block http).
  // - EMAIL_INLINE_FONTS: "1" inlines Satoshi + Zodiak as base64 (~210KB/email).
  //   Off by default; turn on in production to render the brand typography.
  EMAIL_LOGO_URL: z.string().url().optional(),
  EMAIL_INLINE_FONTS: z.enum(["0", "1"]).default("0"),
  EMAIL_BRAND_NAME: z.string().default("LETTY"),

  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  SENTRY_DSN: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function frontendOrigins(): string[] {
  return env()
    .FRONTEND_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isProduction(): boolean {
  return env().NODE_ENV === "production";
}
