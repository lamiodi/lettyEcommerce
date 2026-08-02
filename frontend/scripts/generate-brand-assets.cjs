/**
 * One-off brand asset generator for the LETTY rebrand.
 * - Crops the client-supplied logo plates to the lockup (with padding).
 * - Produces a transparent-background dark logo for dark surfaces.
 * - Extracts the monogram and rebuilds the app favicons.
 * Run: node scripts/generate-brand-assets.cjs
 */
const path = require("node:path");
const sharp = require("../node_modules/sharp");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const LIGHT_SRC = path.join(PUB, "Lettylogolight.jpg.jpeg");
const DARK_SRC = path.join(PUB, "lerrylogodark.jpeg");

const out = (p) => path.join(PUB, "brand", p);

async function sampleCorner(src) {
  const px = await sharp(src)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
  return { r: px[0], g: px[1], b: px[2], alpha: 1 };
}

/** Trim a uniform-plate logo to its lockup and pad with the plate colour. */
async function trimPlate(src, threshold = 14) {
  const buf = await sharp(src).trim({ threshold }).png().toBuffer();
  return buf;
}

async function makeLightLogo() {
  const trimmed = await trimPlate(LIGHT_SRC);
  const { data, info } = await sharp(trimmed)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Estimate plate luminance from the four corners.
  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const bgLum =
    (at(2, 2) + at(info.width - 3, 2) + at(2, info.height - 3) + at(info.width - 3, info.height - 3)) / 4;

  // Inverse luminance key: cream plate -> transparent, espresso artwork -> opaque.
  const t1 = bgLum - 14; // fully transparent above this
  const t0 = bgLum - 110; // fully opaque below this
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0, q = 0; p < data.length; p += info.channels, q += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    const a = Math.max(0, Math.min(1, (t1 - lum) / (t1 - t0)));
    rgba[q] = data[p];
    rgba[q + 1] = data[p + 1];
    rgba[q + 2] = data[p + 2];
    rgba[q + 3] = Math.round(a * 255);
  }

  const pad = Math.round(Math.max(info.width, info.height) * 0.05);
  const written = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out("letty-logo-light.png"), { resolveWithObject: true });
  console.log("light logo:", written.width, "x", written.height, "bgLum", bgLum.toFixed(1));
  return trimmed;
}

/** Convert the dark plate to a transparent PNG via a soft luminance key. */
async function makeDarkLogo() {
  const trimmed = await trimPlate(DARK_SRC);
  const { data, info } = await sharp(trimmed)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Estimate plate luminance from the four corners.
  const cornerLum = [];
  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  cornerLum.push(at(2, 2), at(info.width - 3, 2), at(2, info.height - 3), at(info.width - 3, info.height - 3));
  const bgLum = cornerLum.reduce((a, b) => a + b, 0) / cornerLum.length;

  const t0 = bgLum + 14; // fully transparent below this
  const t1 = bgLum + 90; // fully opaque above this
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0, q = 0; p < data.length; p += info.channels, q += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    const a = Math.max(0, Math.min(1, (lum - t0) / (t1 - t0)));
    rgba[q] = data[p];
    rgba[q + 1] = data[p + 1];
    rgba[q + 2] = data[p + 2];
    rgba[q + 3] = Math.round(a * 255);
  }

  const pad = Math.round(Math.max(info.width, info.height) * 0.05);
  const written = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out("letty-logo-dark.png"), { resolveWithObject: true });
  console.log("dark logo:", written.width, "x", written.height, "bgLum", bgLum.toFixed(1));
}

/** Split monogram from wordmark by scanning for the largest empty row gap. */
async function extractMonogram(lightTrimmed) {
  const { data, info } = await sharp(lightTrimmed)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const rowDark = new Array(info.height).fill(0);
  for (let y = 0; y < info.height; y++) {
    let dark = 0;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * ch;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 150) dark++;
    }
    rowDark[y] = dark;
  }
  // Largest run of near-empty rows starting below 35% of the height.
  let best = { start: -1, len: 0 };
  let run = { start: -1, len: 0 };
  for (let y = 0; y < info.height; y++) {
    if (rowDark[y] <= 2) {
      if (run.start === -1) run = { start: y, len: 0 };
      run.len++;
      if (run.start > info.height * 0.35 && run.len > best.len) best = { ...run };
    } else {
      run = { start: -1, len: 0 };
    }
  }
  const monoHeight = best.start > 0 ? best.start : Math.round(info.height * 0.72);
  const mono = await sharp(lightTrimmed)
    .extract({ left: 0, top: 0, width: info.width, height: monoHeight })
    .trim({ threshold: 14 })
    .png()
    .toBuffer();
  const mMeta = await sharp(mono).metadata();
  console.log("monogram:", mMeta.width, "x", mMeta.height, "(split at row", monoHeight, "of", info.height, ")");
  return mono;
}

async function makeFavicons(monoBuf) {
  const bg = await sampleCorner(LIGHT_SRC);
  const meta = await sharp(monoBuf).metadata();
  const side = Math.round(Math.max(meta.width, meta.height) * 1.28);
  const squared = sharp(monoBuf).extend({
    top: Math.max(0, Math.round((side - meta.height) / 2)),
    bottom: Math.max(0, side - meta.height - Math.round((side - meta.height) / 2)),
    left: Math.max(0, Math.round((side - meta.width) / 2)),
    right: Math.max(0, side - meta.width - Math.round((side - meta.width) / 2)),
    background: bg,
  });
  const buf = await squared.png().toBuffer();
  await sharp(buf).resize(512, 512).png().toFile(path.join(ROOT, "src", "app", "icon.png"));
  await sharp(buf).resize(180, 180).png().toFile(path.join(ROOT, "src", "app", "apple-icon.png"));
  console.log("favicons written (512, 180)");
}

(async () => {
  const lightTrimmed = await makeLightLogo();
  await makeDarkLogo();
  const mono = await extractMonogram(lightTrimmed);
  await makeFavicons(mono);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
