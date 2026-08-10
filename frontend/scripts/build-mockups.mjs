#!/usr/bin/env node
/**
 * Generate brand-neutral SVG mockup imagery for every department /
 * tile / product image key. All output goes into /public/images/ as
 * static .svg files — no third-party brands, no external requests.
 *
 * Run with: node scripts/build-mockups.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "images");

// Brand palette — ivory, ink, gold, stone, blush
const C = {
  bg: "#F2EBE0",
  bg2: "#E8DDD0",
  ink: "#1B1716",
  stone: "#7A6E62",
  gold: "#B08A3E",
  gold2: "#D9B776",
  blush: "#D9A199",
  sage: "#8C9384",
  olive: "#5A5A3A",
  sand: "#D6C5A8",
  charcoal: "#2A2522",
  noir: "#0E0D0C",
  cream: "#F8F2E6",
};

const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bg}"/>
      <stop offset="1" stop-color="${C.bg2}"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8D7B7"/>
      <stop offset="1" stop-color="#C9A875"/>
    </linearGradient>
    <linearGradient id="amber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7A4A22"/>
      <stop offset="1" stop-color="#3B1E0C"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E6D8C2" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#B3997A" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1B1716"/>
      <stop offset="1" stop-color="#0A0908"/>
    </linearGradient>
    <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4ECDC"/>
      <stop offset="1" stop-color="#C8B89B"/>
    </linearGradient>
  </defs>
  ${body}
</svg>`;

// ---------------- builders ----------------

/** Makeup campaign — a face silhouette with full lips and a hat. */
const makeupModel = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.62}" rx="${w * 0.32}" ry="${h * 0.46}" fill="${C.blush}" opacity="0.35"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="${w * 0.18}" ry="${h * 0.24}" fill="#E8C7B0"/>
  <path d="M${w * 0.34} ${h * 0.32} Q${w * 0.5} ${h * 0.18} ${w * 0.66} ${h * 0.32} L${w * 0.66} ${h * 0.4} Q${w * 0.5} ${h * 0.28} ${w * 0.34} ${h * 0.4} Z" fill="${C.charcoal}"/>
  <ellipse cx="${w * 0.42}" cy="${h * 0.54}" rx="3" ry="4" fill="${C.ink}"/>
  <ellipse cx="${w * 0.58}" cy="${h * 0.54}" rx="3" ry="4" fill="${C.ink}"/>
  <path d="M${w * 0.45} ${h * 0.66} Q${w * 0.5} ${h * 0.7} ${w * 0.55} ${h * 0.66} Q${w * 0.5} ${h * 0.68} ${w * 0.45} ${h * 0.66} Z" fill="${C.blush}"/>
  <path d="M${w * 0.5} ${h * 0.18} L${w * 0.62} ${h * 0.22} L${w * 0.6} ${h * 0.24} L${w * 0.5} ${h * 0.2} L${w * 0.4} ${h * 0.24} L${w * 0.38} ${h * 0.22} Z" fill="${C.noir}"/>
`);

/** Fashion campaign — full body silhouette in flowing dress. */
const fashionModel = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${w * 0.5}" ry="${h * 0.55}" fill="${C.bg2}" opacity="0.4"/>
  <path d="M${w * 0.42} ${h * 0.18} Q${w * 0.5} ${h * 0.15} ${w * 0.58} ${h * 0.18} L${w * 0.6} ${h * 0.26} L${w * 0.4} ${h * 0.26} Z" fill="${C.ink}"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.22}" rx="${w * 0.08}" ry="${h * 0.1}" fill="#E8C7B0"/>
  <path d="M${w * 0.36} ${h * 0.3} Q${w * 0.5} ${h * 0.28} ${w * 0.64} ${h * 0.3} L${w * 0.78} ${h * 0.95} L${w * 0.22} ${h * 0.95} Z" fill="url(#dress)"/>
  <path d="M${w * 0.5} ${h * 0.3} L${w * 0.5} ${h * 0.95}" stroke="${C.stone}" stroke-width="1" opacity="0.4"/>
`);

/** Fragrance campaign — a perfume bottle silhouette. */
const fragranceBottle = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${w * 0.45}" ry="${h * 0.5}" fill="${C.bg2}" opacity="0.45"/>
  <rect x="${w * 0.4}" y="${h * 0.3}" width="${w * 0.2}" height="${h * 0.5}" rx="6" fill="url(#glass)" stroke="${C.gold}" stroke-width="2"/>
  <rect x="${w * 0.46}" y="${h * 0.22}" width="${w * 0.08}" height="${h * 0.1}" fill="${C.gold}"/>
  <rect x="${w * 0.43}" y="${h * 0.18}" width="${w * 0.14}" height="${h * 0.06}" rx="2" fill="${C.charcoal}"/>
  <rect x="${w * 0.42}" y="${h * 0.4}" width="${w * 0.16}" height="${h * 0.3}" fill="url(#amber)" opacity="0.6"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.3}" rx="${w * 0.1}" ry="${h * 0.02}" fill="${C.gold2}" opacity="0.6"/>
`);

/** Eyewear campaign — pair of oversized sunglasses. */
const eyewearHero = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="${w * 0.42}" ry="${h * 0.4}" fill="${C.bg2}" opacity="0.4"/>
  <path d="M${w * 0.5} ${h * 0.35} L${w * 0.5} ${h * 0.4}" stroke="${C.noir}" stroke-width="3"/>
  <rect x="${w * 0.15}" y="${h * 0.34}" width="${w * 0.3}" height="${h * 0.18}" rx="${h * 0.05}" fill="${C.noir}"/>
  <rect x="${w * 0.55}" y="${h * 0.34}" width="${w * 0.3}" height="${h * 0.18}" rx="${h * 0.05}" fill="${C.noir}"/>
  <ellipse cx="${w * 0.3}" cy="${h * 0.43}" rx="${w * 0.12}" ry="${h * 0.05}" fill="#1A1816" opacity="0.5"/>
  <ellipse cx="${w * 0.7}" cy="${h * 0.43}" rx="${w * 0.12}" ry="${h * 0.05}" fill="#1A1816" opacity="0.5"/>
  <rect x="${w * 0.45}" y="${h * 0.4}" width="${w * 0.1}" height="${h * 0.02}" fill="${C.gold}"/>
  <path d="M${w * 0.15} ${h * 0.36} L${w * 0.05} ${h * 0.34}" stroke="${C.noir}" stroke-width="4"/>
  <path d="M${w * 0.85} ${h * 0.36} L${w * 0.95} ${h * 0.34}" stroke="${C.noir}" stroke-width="4"/>
`);

/** Editorial break — abstract texture with warm wash. */
const editorialBreak = (palette = "warm") => {
  const grad = palette === "amber" ? "url(#amber)" : palette === "dark" ? "url(#dark)" : "url(#warm)";
  return (w, h) => wrap(w, h, `
    <rect width="${w}" height="${h}" fill="${grad}"/>
    <path d="M0 ${h * 0.5} Q${w * 0.3} ${h * 0.3} ${w * 0.5} ${h * 0.5} T${w} ${h * 0.5} L${w} ${h} L0 ${h} Z" fill="${C.ink}" opacity="0.35"/>
    <circle cx="${w * 0.85}" cy="${h * 0.25}" r="${w * 0.08}" fill="${C.gold2}" opacity="0.5"/>
  `);
};

/** Makeup tile — lipstick + compact on silk. */
const makeupTile = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.9}" fill="${C.cream}" opacity="0.4"/>
  <rect x="${w * 0.25}" y="${h * 0.45}" width="${w * 0.1}" height="${h * 0.35}" fill="${C.gold}"/>
  <rect x="${w * 0.24}" y="${h * 0.78}" width="${w * 0.12}" height="${h * 0.06}" fill="${C.charcoal}"/>
  <path d="M${w * 0.25} ${h * 0.45} L${w * 0.3} ${h * 0.35} L${w * 0.3} ${h * 0.45} Z" fill="${C.blush}"/>
  <circle cx="${w * 0.6}" cy="${h * 0.6}" r="${w * 0.12}" fill="${C.gold2}" opacity="0.6"/>
  <circle cx="${w * 0.6}" cy="${h * 0.6}" r="${w * 0.1}" fill="${C.gold}"/>
  <circle cx="${w * 0.6}" cy="${h * 0.6}" r="${w * 0.07}" fill="${C.cream}"/>
`);

/** Body tile — jar + oil bottle on spa linen. */
const bodyTile = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w * 0.15}" y="${h * 0.35}" width="${w * 0.25}" height="${h * 0.4}" rx="6" fill="url(#glass)" stroke="${C.gold}" stroke-width="1.5"/>
  <rect x="${w * 0.15}" y="${h * 0.33}" width="${w * 0.25}" height="${h * 0.05}" rx="2" fill="${C.gold}"/>
  <rect x="${w * 0.55}" y="${h * 0.3}" width="${w * 0.1}" height="${h * 0.5}" rx="3" fill="url(#glass)" stroke="${C.gold}" stroke-width="1.5"/>
  <circle cx="${w * 0.6}" cy="${h * 0.28}" r="${w * 0.02}" fill="${C.gold}"/>
  <rect x="${w * 0.62}" y="${h * 0.22}" width="${w * 0.01}" height="${h * 0.05}" fill="${C.gold2}"/>
`);

/** Skincare tile — serum + moisturizer bottles. */
const skincareTile = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w * 0.2}" y="${h * 0.25}" width="${w * 0.18}" height="${h * 0.5}" rx="4" fill="${C.cream}" stroke="${C.stone}" stroke-width="1"/>
  <rect x="${w * 0.2}" y="${h * 0.2}" width="${w * 0.18}" height="${h * 0.07}" fill="${C.gold}"/>
  <rect x="${w * 0.5}" y="${h * 0.35}" width="${w * 0.25}" height="${h * 0.4}" rx="6" fill="url(#glass)"/>
  <rect x="${w * 0.5}" y="${h * 0.33}" width="${w * 0.25}" height="${h * 0.05}" fill="${C.gold}"/>
`);

/** Fashion tile — generic garment silhouette. */
const fashionTile = (w, h, style = "dress") => {
  let body;
  if (style === "dress") {
    body = `
      <path d="M${w * 0.4} ${h * 0.2} L${w * 0.6} ${h * 0.2} L${w * 0.55} ${h * 0.32} L${w * 0.7} ${h * 0.85} L${w * 0.3} ${h * 0.85} L${w * 0.45} ${h * 0.32} Z" fill="url(#dress)"/>
      <circle cx="${w * 0.5}" cy="${h * 0.18}" r="${w * 0.06}" fill="#E8C7B0"/>`;
  } else if (style === "sets") {
    body = `
      <path d="M${w * 0.35} ${h * 0.22} L${w * 0.65} ${h * 0.22} L${w * 0.7} ${h * 0.45} L${w * 0.3} ${h * 0.45} Z" fill="${C.sand}"/>
      <path d="M${w * 0.32} ${h * 0.48} L${w * 0.68} ${h * 0.48} L${w * 0.7} ${h * 0.85} L${w * 0.3} ${h * 0.85} Z" fill="${C.sand}"/>
      <circle cx="${w * 0.5}" cy="${h * 0.18}" r="${w * 0.06}" fill="#E8C7B0"/>`;
  } else if (style === "tops") {
    body = `
      <path d="M${w * 0.32} ${h * 0.22} L${w * 0.45} ${h * 0.18} L${w * 0.55} ${h * 0.18} L${w * 0.68} ${h * 0.22} L${w * 0.68} ${h * 0.5} L${w * 0.32} ${h * 0.5} Z" fill="${C.cream}"/>
      <circle cx="${w * 0.5}" cy="${h * 0.16}" r="${w * 0.06}" fill="#E8C7B0"/>`;
  } else {
    body = `
      <path d="M${w * 0.32} ${h * 0.22} L${w * 0.68} ${h * 0.22} L${w * 0.7} ${h * 0.88} L${w * 0.3} ${h * 0.88} Z" fill="${C.ink}"/>
      <circle cx="${w * 0.5}" cy="${h * 0.16}" r="${w * 0.06}" fill="#E8C7B0"/>`;
  }
  return wrap(w, h, `
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${body}
  `);
};

/** Fragrance tile — a perfume bottle per mood. */
const fragranceTile = (w, h, variant) => {
  const fill = variant === "her" ? "url(#glass)" : variant === "him" ? "url(#dark)" : "url(#warm)";
  const cap = variant === "him" ? C.noir : C.gold;
  return wrap(w, h, `
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect x="${w * 0.4}" y="${h * 0.32}" width="${w * 0.2}" height="${h * 0.5}" rx="4" fill="${fill}" stroke="${C.gold}" stroke-width="1.5"/>
    <rect x="${w * 0.46}" y="${h * 0.22}" width="${w * 0.08}" height="${h * 0.12}" fill="${cap}"/>
    <rect x="${w * 0.42}" y="${h * 0.18}" width="${w * 0.16}" height="${h * 0.06}" rx="2" fill="${C.charcoal}"/>
    ${variant === "her" ? `<circle cx="${w * 0.3}" cy="${h * 0.7}" r="${w * 0.04}" fill="${C.blush}"/><circle cx="${w * 0.75}" cy="${h * 0.78}" r="${w * 0.05}" fill="${C.blush}"/>` : ""}
  `);
};

/** Eyewear product — single pair silhouette on ivory. */
const shades = (w, h, frame = "noir") => {
  const color = frame === "noir" ? C.noir : frame === "gold" ? C.gold : frame === "tortoise" ? "#3B2A1F" : frame === "ivory" ? C.cream : C.charcoal;
  return wrap(w, h, `
    <rect width="${w}" height="${h}" fill="${C.cream}"/>
    <ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="${w * 0.45}" ry="${h * 0.4}" fill="${C.bg}" opacity="0.5"/>
    <rect x="${w * 0.15}" y="${h * 0.38}" width="${w * 0.3}" height="${h * 0.18}" rx="${h * 0.05}" fill="${color}"/>
    <rect x="${w * 0.55}" y="${h * 0.38}" width="${w * 0.3}" height="${h * 0.18}" rx="${h * 0.05}" fill="${color}"/>
    <rect x="${w * 0.45}" y="${h * 0.44}" width="${w * 0.1}" height="${h * 0.02}" fill="${C.gold}"/>
    <path d="M${w * 0.15} ${h * 0.4} L${w * 0.05} ${h * 0.38}" stroke="${color}" stroke-width="4"/>
    <path d="M${w * 0.85} ${h * 0.4} L${w * 0.95} ${h * 0.38}" stroke="${color}" stroke-width="4"/>
  `);
};

/** Generic product silhouette for body / fashion product shots. */
const productShot = (w, h, kind) => {
  if (kind === "creme") {
    return wrap(w, h, `
      <rect width="${w}" height="${h}" fill="${C.cream}"/>
      <rect x="${w * 0.25}" y="${h * 0.4}" width="${w * 0.5}" height="${h * 0.4}" rx="8" fill="url(#glass)" stroke="${C.gold}" stroke-width="2"/>
      <rect x="${w * 0.22}" y="${h * 0.36}" width="${w * 0.56}" height="${h * 0.06}" rx="3" fill="${C.gold}"/>
      <rect x="${w * 0.3}" y="${h * 0.6}" width="${w * 0.4}" height="${h * 0.04}" fill="${C.stone}" opacity="0.4"/>
    `);
  }
  if (kind === "oil") {
    return wrap(w, h, `
      <rect width="${w}" height="${h}" fill="${C.cream}"/>
      <rect x="${w * 0.38}" y="${h * 0.3}" width="${w * 0.24}" height="${h * 0.55}" rx="4" fill="url(#glass)" stroke="${C.gold}" stroke-width="1.5"/>
      <rect x="${w * 0.42}" y="${h * 0.22}" width="${w * 0.16}" height="${h * 0.1}" fill="${C.charcoal}"/>
      <ellipse cx="${w * 0.5}" cy="${h * 0.22}" rx="${w * 0.04}" ry="${h * 0.02}" fill="${C.gold}"/>
      <rect x="${w * 0.42}" y="${h * 0.5}" width="${w * 0.16}" height="${h * 0.3}" fill="url(#amber)" opacity="0.6"/>
    `);
  }
  // knit set or trousers — garment-on-neutral
  if (kind === "knit") {
    return wrap(w, h, `
      <rect width="${w}" height="${h}" fill="${C.cream}"/>
      <path d="M${w * 0.3} ${h * 0.2} L${w * 0.7} ${h * 0.2} L${w * 0.75} ${h * 0.5} L${w * 0.25} ${h * 0.5} Z" fill="${C.sand}"/>
      <path d="M${w * 0.32} ${h * 0.52} L${w * 0.68} ${h * 0.52} L${w * 0.72} ${h * 0.9} L${w * 0.28} ${h * 0.9} Z" fill="${C.sand}"/>
    `);
  }
  if (kind === "trousers") {
    return wrap(w, h, `
      <rect width="${w}" height="${h}" fill="${C.cream}"/>
      <path d="M${w * 0.35} ${h * 0.18} L${w * 0.65} ${h * 0.18} L${w * 0.68} ${h * 0.9} L${w * 0.32} ${h * 0.9} Z" fill="${C.cream}"/>
      <line x1="${w * 0.5}" y1="${h * 0.18}" x2="${w * 0.5}" y2="${h * 0.9}" stroke="${C.stone}" stroke-width="0.6"/>
    `);
  }
  return wrap(w, h, `<rect width="${w}" height="${h}" fill="${C.cream}"/>`);
};

/** Shop-the-look composite — silhouette + accessories. */
const shopTheLook = (w, h) => wrap(w, h, `
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${w * 0.45}" ry="${h * 0.5}" fill="${C.bg2}" opacity="0.4"/>
  <circle cx="${w * 0.5}" cy="${h * 0.22}" r="${w * 0.08}" fill="#E8C7B0"/>
  <path d="M${w * 0.36} ${h * 0.3} Q${w * 0.5} ${h * 0.28} ${w * 0.64} ${h * 0.3} L${w * 0.74} ${h * 0.85} L${w * 0.26} ${h * 0.85} Z" fill="url(#dress)"/>
  <rect x="${w * 0.18}" y="${h * 0.42}" width="${w * 0.2}" height="${h * 0.4}" fill="${C.sand}" opacity="0.7" transform="rotate(-12 ${w * 0.28} ${h * 0.62})"/>
  <rect x="${w * 0.66}" y="${h * 0.6}" width="${w * 0.18}" height="${h * 0.14}" fill="${C.gold}" opacity="0.7"/>
`);

// ---------------- registry ----------------
const TASKS = [
  // Department heroes (landscape 1600x900)
  { key: "deptMakeupHero", w: 1600, h: 900, body: makeupModel(1600, 900) },
  { key: "deptFashionHero", w: 1600, h: 900, body: fashionModel(1600, 900) },
  { key: "deptFragranceHero", w: 1600, h: 900, body: fragranceBottle(1600, 900) },
  { key: "deptEyewearHero", w: 1600, h: 900, body: eyewearHero(1600, 900) },

  // Department editorial breaks (landscape 1600x900)
  { key: "deptMakeupEditorial", w: 1600, h: 900, body: editorialBreak("warm")(1600, 900) },
  { key: "deptFashionEditorial", w: 1600, h: 900, body: editorialBreak("warm")(1600, 900) },
  { key: "deptFragranceEditorial", w: 1600, h: 900, body: editorialBreak("amber")(1600, 900) },
  { key: "deptEyewearEditorial", w: 1600, h: 900, body: editorialBreak("dark")(1600, 900) },

  // Department tiles (portrait 1200x1600)
  { key: "tileMakeup", w: 1200, h: 1600, body: makeupTile(1200, 1600) },
  { key: "tileBody", w: 1200, h: 1600, body: bodyTile(1200, 1600) },
  { key: "tileSkincare", w: 1200, h: 1600, body: skincareTile(1200, 1600) },
  { key: "tileDresses", w: 1200, h: 1600, body: fashionTile(1200, 1600, "dress") },
  { key: "tileSets", w: 1200, h: 1600, body: fashionTile(1200, 1600, "sets") },
  { key: "tileTops", w: 1200, h: 1600, body: fashionTile(1200, 1600, "tops") },
  { key: "tileBottoms", w: 1200, h: 1600, body: fashionTile(1200, 1600, "bottoms") },
  { key: "tileForHer", w: 1200, h: 1600, body: fragranceTile(1200, 1600, "her") },
  { key: "tileForHim", w: 1200, h: 1600, body: fragranceTile(1200, 1600, "him") },
  { key: "tileUnisex", w: 1200, h: 1600, body: fragranceTile(1200, 1600, "uni") },

  // Shop the look
  { key: "lookAtelier", w: 1200, h: 1600, body: shopTheLook(1200, 1600) },

  // Product shots (square 1200x1200)
  { key: "productBodyCreme", w: 1200, h: 1200, body: productShot(1200, 1200, "creme") },
  { key: "productBodyOil", w: 1200, h: 1200, body: productShot(1200, 1200, "oil") },
  { key: "productShadesNoir", w: 1200, h: 1200, body: shades(1200, 1200, "noir") },
  { key: "productShadesAviator", w: 1200, h: 1200, body: shades(1200, 1200, "gold") },
  { key: "productShadesCatEye", w: 1200, h: 1200, body: shades(1200, 1200, "tortoise") },
  { key: "productShadesIvory", w: 1200, h: 1200, body: shades(1200, 1200, "ivory") },
  { key: "productShadesRound", w: 1200, h: 1200, body: shades(1200, 1200, "round") },
  { key: "productKnitSet", w: 1200, h: 1200, body: productShot(1200, 1200, "knit") },
  { key: "productWideTrousers", w: 1200, h: 1200, body: productShot(1200, 1200, "trousers") },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const t of TASKS) {
    const out = join(OUT, `${t.key}.svg`);
    await writeFile(out, t.body, "utf8");
    console.log(`  · ${t.key}.svg (${(t.body.length / 1024).toFixed(1)} KB)`);
  }
  console.log(`\nDone. ${TASKS.length} mockup SVGs written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
