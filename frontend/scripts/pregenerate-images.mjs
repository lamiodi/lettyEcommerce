#!/usr/bin/env node
/**
 * Pre-generate every campaign image used by LETTY into /public/images/
 * so the storefront serves them as static assets (no placeholder, no
 * per-request generation latency).
 *
 * Reads the same prompts and sizes declared in src/lib/images.ts so the
 * two files stay in sync. Run with `node scripts/pregenerate-images.mjs`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "images");

const IMAGES = {
  // ---------- Department worlds (campaign imagery) ----------
  deptMakeupHero: ["luxury makeup campaign photograph, beautiful model with flawless glowing skin and elegant neutral makeup, gold and ivory tones, high fashion beauty editorial, soft studio lighting, photorealistic, 8k", "landscape_16_9"],
  deptFashionHero: ["high fashion editorial photograph, elegant model in flowing ivory silk dress, luxury boutique campaign, neutral beige tones, cinematic soft light, full body pose, photorealistic, 8k", "landscape_16_9"],
  deptFragranceHero: ["atmospheric luxury perfume campaign, elegant glass flacon among silk fabric and warm amber light haze, sensual moody editorial photography, gold and deep amber tones, photorealistic, 8k", "landscape_16_9"],
  deptEyewearHero: ["fashion editorial photograph of a model wearing oversized luxury sunglasses, striking pose, warm golden hour light, high fashion campaign, neutral tones, photorealistic, 8k", "landscape_16_9"],
  deptMakeupEditorial: ["luxury beauty flat lay editorial, couture lipsticks gold cases and makeup brushes on ivory silk, soft shadows, warm neutral palette, high end cosmetics photography, photorealistic", "landscape_16_9"],
  deptFashionEditorial: ["editorial fashion photograph, model in tailored neutral tailoring walking in soft evening light, luxury atelier campaign, beige and ivory palette, cinematic, photorealistic", "landscape_16_9"],
  deptFragranceEditorial: ["moody perfume still life, amber glass bottles on warm stone with dramatic shadows and orchid petals, sensual luxury fragrance editorial, photorealistic", "landscape_16_9"],
  deptEyewearEditorial: ["luxury sunglasses still life editorial, designer frames arranged on travertine stone with hard sunlight and long shadows, minimal warm palette, photorealistic", "landscape_16_9"],

  // ---------- Department tiles ----------
  tileMakeup: ["luxury lipstick and gold makeup compact on silk fabric, editorial beauty photography, warm neutral tones, soft light, photorealistic", "portrait_4_3"],
  tileBody: ["luxury body care cream jar and body oil bottle in spa setting with warm towel, editorial photography, neutral spa tones, photorealistic", "portrait_4_3"],
  tileSkincare: ["luxury skincare serum and moisturizer bottles in soft morning light, minimal editorial beauty photography, ivory and blush tones, photorealistic", "portrait_4_3"],
  tileDresses: ["elegant model wearing ivory silk slip dress, editorial fashion photography, neutral backdrop, soft light, photorealistic", "portrait_4_3"],
  tileSets: ["model wearing matching cashmere knit coord set in oatmeal tone, editorial fashion photography, warm minimal backdrop, photorealistic", "portrait_4_3"],
  tileTops: ["model wearing relaxed silk shirt tucked into tailored waistband, editorial fashion photography, neutral tones, soft light, photorealistic", "portrait_4_3"],
  tileBottoms: ["model wearing high rise wide leg trousers in ivory wool, editorial fashion photography, studio light, neutral palette, photorealistic", "portrait_4_3"],
  tileForHer: ["feminine luxury perfume bottle with rose petals and warm golden light, editorial fragrance photography, romantic soft tones, photorealistic", "portrait_4_3"],
  tileForHim: ["masculine dark perfume flacon on slate with smoke and dramatic moody light, editorial fragrance photography, photorealistic", "portrait_4_3"],
  tileUnisex: ["minimal unisex fragrance bottle on neutral stone with clean daylight, editorial photography, ivory and sand tones, photorealistic", "portrait_4_3"],

  // ---------- Shop the Look ----------
  lookAtelier: ["full length editorial fashion photograph, model wearing ivory silk slip dress with oatmeal cashmere cardigan draped over shoulders and small tan leather tote, warm studio light, luxury campaign, photorealistic", "portrait_4_3"],

  // ---------- Products: Body ----------
  productBodyCreme: ["luxury body cream in frosted glass jar with gold lid, product photography on ivory background, soft shadow, warm neutral tones, photorealistic", "square"],
  productBodyOil: ["golden body oil in slim glass bottle with dropper, luxury product photography on warm stone, soft light, photorealistic", "square"],

  // ---------- Products: Eyewear ----------
  productShadesNoir: ["oversized black acetate luxury sunglasses, product photography on ivory background, soft shadow, high fashion eyewear, photorealistic", "square"],
  productShadesAviator: ["gold frame aviator sunglasses with gradient amber lenses, luxury product photography on ivory background, soft shadow, photorealistic", "square"],
  productShadesCatEye: ["tortoiseshell cat-eye luxury sunglasses, product photography on ivory background, soft shadow, high fashion eyewear, photorealistic", "square"],
  productShadesIvory: ["ivory white square frame designer sunglasses, luxury product photography on neutral background, soft shadow, photorealistic", "square"],
  productShadesRound: ["round thin gold wire sunglasses with dark green lenses, luxury product photography on ivory background, soft shadow, photorealistic", "square"],

  // ---------- Products: Fashion additions ----------
  productKnitSet: ["matching oatmeal cashmere knit sweater and trousers coord set on model, luxury product photography, neutral studio backdrop, photorealistic", "square"],
  productWideTrousers: ["high rise wide leg ivory wool trousers on model, luxury fashion product photography, neutral studio backdrop, photorealistic", "square"],
};

const ALTS = {
  deptMakeupHero: "Makeup & Beauty campaign — model with flawless glowing skin in golden light",
  deptFashionHero: "Fashion campaign — model in flowing ivory silk, editorial pose",
  deptFragranceHero: "Fragrance campaign — perfume flacon in warm amber haze",
  deptEyewearHero: "Eyewear campaign — model in oversized sunglasses, golden hour",
  deptMakeupEditorial: "Makeup editorial — couture lipsticks and brushes on ivory silk",
  deptFashionEditorial: "Fashion editorial — tailored neutrals in evening light",
  deptFragranceEditorial: "Fragrance editorial — amber bottles and orchid petals on stone",
  deptEyewearEditorial: "Eyewear editorial — designer frames on travertine in hard light",
  tileMakeup: "Makeup tile — lipstick and gold compact on silk",
  tileBody: "Body care tile — cream jar and oil in a warm spa scene",
  tileSkincare: "Skincare tile — serum and moisturizer in morning light",
  tileDresses: "Dresses tile — ivory silk slip dress on model",
  tileSets: "Sets tile — matching cashmere coord set",
  tileTops: "Tops tile — relaxed silk shirt, editorial styling",
  tileBottoms: "Bottoms tile — wide-leg ivory trousers",
  tileForHer: "For Her tile — perfume with rose petals in golden light",
  tileForHim: "For Him tile — dark flacon on slate with smoke",
  tileUnisex: "Unisex tile — minimal fragrance bottle on stone",
  lookAtelier: "The Atelier look — silk slip dress, cashmere wrap and mini tote",
  productBodyCreme: "Velvet Body Crème in frosted glass jar",
  productBodyOil: "Golden Hour Body Oil in slim glass bottle",
  productShadesNoir: "Noir Oversized sunglasses in black acetate",
  productShadesAviator: "Riviera gold aviator sunglasses",
  productShadesCatEye: "Tortoise cat-eye sunglasses",
  productShadesIvory: "Ivory square-frame sunglasses",
  productShadesRound: "Midnight round wire-frame sunglasses",
  productKnitSet: "Cashmere knit coord set in oatmeal",
  productWideTrousers: "High-rise wide-leg trousers in ivory wool",
};

const BASE = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image";
const CONCURRENCY = 4;
const TIMEOUT_MS = 90000;

async function fetchOne(key) {
  const [prompt, size] = IMAGES[key];
  const url = `${BASE}?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${key} → HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = contentType.includes("png") ? "png" : "jpg";
    return { key, buf, ext };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const keys = Object.keys(IMAGES);
  console.log(`Generating ${keys.length} images into ${OUT} …`);

  const results = await runPool(keys, CONCURRENCY, async (key) => {
    process.stdout.write(`  · ${key} … `);
    try {
      const r = await fetchOne(key);
      const out = join(OUT, `${key}.${r.ext}`);
      await writeFile(out, r.buf);
      process.stdout.write(`ok (${(r.buf.length / 1024).toFixed(0)} kb)\n`);
      return { key, ok: true, ext: r.ext };
    } catch (e) {
      process.stdout.write(`FAILED (${e.message})\n`);
      return { key, ok: false, error: e.message };
    }
  });

  const manifest = {};
  for (const r of results) {
    if (r.ok) {
      manifest[r.key] = {
        src: `/images/${r.key}.${r.ext}`,
        alt: ALTS[r.key] ?? r.key,
      };
    }
  }
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => f.key).join(", "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
