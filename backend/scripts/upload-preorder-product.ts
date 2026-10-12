import "dotenv/config";
import { Client } from "pg";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * One-off: upload the Lash Book pre-order product to the live database —
 * Cloudinary media first (signed REST upload, no SDK dependency), then
 * products / product_variants / variant_options / product_media rows so the
 * kit is fully editable in /admin/products. Idempotent: safe to re-run.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing CLOUDINARY_* credentials in environment");
  process.exit(1);
}

// Keep DB ids aligned with the storefront mock catalog (frontend/src/lib/mock/products.ts)
// so the inventory overlay matches by variant_id, not just SKU.
const PRODUCT_ID = "e5a1c8f3-2b47-4d69-8a30-9f1e7c4d2b58";
const VARIANT_ID = "c7f2d9a6-4e18-4b53-9c82-1d6a8f3e5b07";

const cld = (publicId: string) =>
  `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;

async function uploadToCloudinary(local: string, publicId: string): Promise<void> {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const form = new FormData();
  form.append("file", new Blob([await readFile(local)]));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${await res.text()}`);
  }
}

const DETAILS = [
  "544 reusable cluster lashes in four volumes: 60D, 100D, 120D, 150D",
  "Mixed 10–16mm lengths for a custom, seamless gradient",
  "Strong-hold lash glue and mild remover included",
  "Weightless clusters with a stable, long-lasting curl",
  "Everything for application and removal in one book",
];

const WHAT_ELSE = [
  "Weightless wear that feels like nothing on the eye",
  "Stable curl that holds its lift all day",
  "Reusable clusters — clean gently and re-wear",
  "Long-lasting hold from the included strong glue",
  "Mild remover dissolves glue without tugging",
  "Slim book format, made for touch-ups on the go",
];

const HOW_TO = [
  {
    title: "Glue",
    text: "Apply lash glue to the cluster band using the brush, then wait 30 seconds for the tack to set.",
  },
  {
    title: "Attach",
    text: "Place the lash clusters along the lash line and press gently to secure.",
  },
  {
    title: "Remove",
    text: "Saturate the clusters with the mild eyelash glue remover to dissolve the glue, then gently peel the lashes away.",
  },
];

const MEDIA = [
  {
    file: "lash-book-02.jpg",
    alt: "The Letty Lash Book — travel-ready lash palette holding 544 cluster lashes, glue and remover",
    primary: true,
  },
  {
    file: "lash-book-01.jpg",
    alt: "Letty Lash Book Kit — DIY cluster lashes in 60D, 100D, 120D and 150D, mixed 10–16mm lengths",
    primary: false,
  },
  {
    file: "lash-book-03.jpg",
    alt: "Letty Lash Book Kit — kit detail",
    primary: false,
  },
];

async function uploadMedia(): Promise<string[]> {
  const dir = join(process.cwd(), "..", "frontend", "public", "products", "lash-book");
  const urls: string[] = [];
  for (const m of MEDIA) {
    const local = join(dir, m.file);
    const publicId = `letty/products/lash-book/${m.file.replace(/\.[^.]+$/, "")}`;
    process.stdout.write(`Uploading ${publicId} ... `);
    await uploadToCloudinary(local, publicId);
    console.log("OK");
    urls.push(cld(publicId));
  }
  return urls;
}

async function main() {
  const mediaUrls = await uploadMedia();

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to PostgreSQL.");
  try {
    await client.query("BEGIN");

    // Brand + parent category (created by transfer-products.ts)
    const brandRes = await client.query<{ id: string }>(
      "SELECT id FROM brands WHERE slug = 'letty' LIMIT 1",
    );
    if (brandRes.rowCount === 0) throw new Error("Brand 'letty' not found — run transfer-products.ts first");
    const brandId = brandRes.rows[0].id;

    const makeupRes = await client.query<{ id: string }>(
      "SELECT id FROM categories WHERE slug = 'makeup' LIMIT 1",
    );
    if (makeupRes.rowCount === 0) throw new Error("Category 'makeup' not found — run transfer-products.ts first");
    const makeupId = makeupRes.rows[0].id;

    const lashesRes = await client.query<{ id: string }>(
      `INSERT INTO categories (slug, name, description, is_active, position, parent_id)
       VALUES ('lashes', 'Lashes', 'DIY cluster lash kits and lash essentials.', true, 3, $1)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
       RETURNING id`,
      [makeupId],
    );
    const lashesId = lashesRes.rows[0].id;
    console.log("✓ Category 'lashes' ready:", lashesId);

    const productRes = await client.query<{ id: string }>(
      `INSERT INTO products (
         id, slug, name, brand_id, category_id, description, short_description,
         base_price_usd, base_price_gbp, base_price_ngn,
         is_active, is_featured, is_new, is_bestseller, is_vegan,
         tagline, details, what_it_is, what_it_does, what_else_to_know,
         how_to_use_steps, pro_tip,
         rating, review_count,
         meta_title, meta_description, og_image
       ) VALUES (
         $1, 'letty-lash-book-kit', 'Letty Lash Book Kit', $2, $3, $4, $5,
         12.12, 12.12, 19392.00,
         true, false, true, false, false,
         $6, $7::jsonb, $8, $9, $10::jsonb,
         $11::jsonb, $12,
         0, 0,
         'Letty Lash Book Kit | Pre-Order',
         'Pre-order the Letty Lash Book Kit — 544 reusable cluster lashes in 60D, 100D, 120D and 150D with glue and remover included.',
         $13
       )
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         short_description = EXCLUDED.short_description,
         base_price_usd = EXCLUDED.base_price_usd,
         base_price_gbp = EXCLUDED.base_price_gbp,
         base_price_ngn = EXCLUDED.base_price_ngn,
         is_new = EXCLUDED.is_new,
         tagline = EXCLUDED.tagline,
         details = EXCLUDED.details,
         what_it_is = EXCLUDED.what_it_is,
         what_it_does = EXCLUDED.what_it_does,
         what_else_to_know = EXCLUDED.what_else_to_know,
         how_to_use_steps = EXCLUDED.how_to_use_steps,
         pro_tip = EXCLUDED.pro_tip,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         og_image = EXCLUDED.og_image
       RETURNING id`,
      [
        PRODUCT_ID,
        brandId,
        lashesId,
        "The complete DIY lash extension ritual, bound in one travel-ready book. Inside: 544 reusable cluster lashes across four volumes — 60D, 100D, 120D and 150D — in mixed 10–16mm lengths, with a strong-hold lash glue and a mild remover alongside. Weightless clusters with a stable, long-lasting curl: everything you need to apply and remove at home, saving you time and money.",
        "544 Cluster Lashes · Four Volumes · One Book",
        "544 Cluster Lashes · Four Volumes · One Book",
        JSON.stringify(DETAILS),
        "A DIY cluster lash kit — 544 reusable lashes in four volumes with glue and remover, all bound in one slim book.",
        "Each weightless cluster holds a stable, uniform curl, so the look you build in the mirror is the look you keep.\n\nFour volumes let you dial the drama — from soft, natural definition to full, lashed-up volume — and because every cluster is reusable, one book carries you through wear after wear. Glue and remover are included, so there is nothing else to buy.",
        JSON.stringify(WHAT_ELSE),
        JSON.stringify(HOW_TO),
        "For the most natural result, start with the shorter 10mm clusters in the inner corner and graduate to 16mm toward the outer corner — the mixed lengths are there to build a seamless gradient.",
        mediaUrls[0],
      ],
    );
    const productId = productRes.rows[0].id;
    console.log("✓ Product upserted:", productId);

    const variantRes = await client.query<{ id: string }>(
      `INSERT INTO product_variants (
         id, product_id, sku, price_override_usd, price_override_ngn,
         stock_quantity, is_active, position, image_url, images
       ) VALUES (
         $1, $2, 'LET-LB-01', 12.12, 19392.00,
         40, true, 0, $3, $4::jsonb
       )
       ON CONFLICT (sku) DO UPDATE SET
         stock_quantity = EXCLUDED.stock_quantity,
         image_url = EXCLUDED.image_url,
         images = EXCLUDED.images,
         price_override_usd = EXCLUDED.price_override_usd,
         price_override_ngn = EXCLUDED.price_override_ngn
       RETURNING id`,
      [VARIANT_ID, productId, mediaUrls[0], JSON.stringify(mediaUrls)],
    );
    const variantId = variantRes.rows[0].id;
    console.log("✓ Variant upserted:", variantId);

    await client.query(
      `INSERT INTO variant_options (variant_id, option_name, option_value)
       VALUES ($1, 'Size', 'Complete Kit')
       ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value`,
      [variantId],
    );

    await client.query("DELETE FROM product_media WHERE product_id = $1", [productId]);
    for (const [i, m] of MEDIA.entries()) {
      await client.query(
        `INSERT INTO product_media (product_id, url, alt_text, position, is_primary, type)
         VALUES ($1, $2, $3, $4, $5, 'image')`,
        [productId, mediaUrls[i], m.alt, i, m.primary],
      );
    }
    console.log("✓ Media stored:", mediaUrls.length, "images");

    await client.query(
      `INSERT INTO collection_products (collection_id, product_id, position)
       SELECT c.id, $1, 3 FROM collections c WHERE c.slug = 'the-edit'
       ON CONFLICT (collection_id, product_id) DO NOTHING`,
      [productId],
    );

    await client.query("COMMIT");
    console.log("\n🎉 Lash Book pre-order product uploaded — editable at /admin/products.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Upload failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
