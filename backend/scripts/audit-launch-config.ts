/** Read-only configuration/schema checks. Never prints credentials or contacts. */
import dotenv from "dotenv";
import { products as storefrontProducts } from "../../frontend/src/lib/mock/products";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
async function main() {
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
const frontend = dotenv.parse(existsSync("../frontend/.env.local") ? readFileSync("../frontend/.env.local") : "");
const mode = (key?: string) => !key ? "missing" : /^(sk|pk|rk)_test_/.test(key) ? "test" : /^(sk|pk|rk)_live_/.test(key) ? "live" : "unrecognised";
const result: Record<string, unknown> = {
  configuration: Object.fromEntries(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET_KEY", "JOBS_SECRET_KEY", "RESEND_API_KEY", "EMAIL_FROM", "EMAIL_LEGAL_ADDRESS", "STRIPE_WEBHOOK_SECRET"].map(key => [key, Boolean(process.env[key])])),
  stripeSecretMode: mode(process.env.STRIPE_SECRET_KEY),
  stripePublishableMode: mode(frontend.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  productionSiteConfigured: process.env.NEXT_PUBLIC_SITE_URL === "https://www.houseofletty.com",
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8_000) }) } });
  const tables = [["email_outbox", "id,dedupe_key,payload,lock_token,sent_at"], ["password_reset_tokens", "id,token_hash,used_at"], ["contact_submissions", "id,order_number,survey_sent_at"], ["newsletter_subscribers", "id,is_subscribed,unsubscribed_at"]];
  result.schema = await Promise.all(tables.map(async ([table, fields]) => {
    try { const { error, status } = await client.from(table).select(fields).limit(0); return { table, status, available: !error, errorCode: error?.code ?? null }; }
    catch { return { table, available: false, errorCode: "network_or_timeout" }; }
  }));
  try {
    const { data, error } = await client.from("products").select("id,name,slug,base_price_gbp,is_active,product_variants(id,sku,color,stock_quantity,price_override_gbp,is_active,image_url)")
      .in("slug", ["letty-lash-book-kit", "letty-mwah-lip-balm", "letty-glass-lip-gloss", "letty-velvet-lip-liner"]);
    result.catalog = error ? { errorCode: error.code } : data;
    if (!error && data) {
      const differences: Array<Record<string, unknown>> = [];
      for (const product of storefrontProducts) {
        const saved = data.find(row => row.slug === product.slug);
        if (!saved) { differences.push({ slug: product.slug, issue: "missing_database_product" }); continue; }
        if (saved.name.toLowerCase() !== product.name.toLowerCase()) differences.push({ slug: product.slug, issue: "name", storefront: product.name, database: saved.name });
        if (Number(saved.base_price_gbp) !== product.basePriceUsd) differences.push({ slug: product.slug, issue: "gbp_price", storefront: product.basePriceUsd, database: saved.base_price_gbp });
        for (const variant of product.variants) {
          const savedVariant = saved.product_variants.find(row => row.sku === variant.sku);
          if (!savedVariant) { differences.push({ sku: variant.sku, issue: "missing_database_variant" }); continue; }
          if (savedVariant.id !== variant.id) differences.push({ sku: variant.sku, issue: "variant_id" });
          if (String(savedVariant.color ?? "").normalize("NFC").toLowerCase() !== String(variant.color ?? "").normalize("NFC").toLowerCase()) differences.push({ sku: variant.sku, issue: "shade_label", storefront: variant.color, database: savedVariant.color });
        }
      }
      result.catalogDifferences = differences;
    }
  } catch { result.catalog = { errorCode: "network_or_timeout" }; }
}
process.stdout.write(JSON.stringify(result, null, 2));

}
main().catch(() => { process.stderr.write("Configuration inspection failed. No credentials were printed.\n"); process.exitCode = 1; });
