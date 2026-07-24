/**
 * Copy the brand variable fonts from `frontend/src/fonts/` into
 * `backend/public/fonts/` so the email renderer can inline them.
 *
 * Run once after `npm install` or whenever the font files are updated.
 * Idempotent — only writes when the source is newer.
 *
 * Usage:  node backend/scripts/sync-email-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const pairs = [
  ["frontend/src/fonts/Satoshi-Variable.ttf", "backend/public/fonts/Satoshi-Variable.ttf"],
  ["frontend/src/fonts/Zodiak-Variable.ttf", "backend/public/fonts/Zodiak-Variable.ttf"],
  ["frontend/public/brand/letty-emblem.png", "backend/public/brand/letty-emblem.png"],
];

let copied = 0;
let skipped = 0;
let missing = 0;

for (const [from, to] of pairs) {
  const src = resolve(repoRoot, from);
  const dst = resolve(repoRoot, to);
  if (!existsSync(src)) {
    console.warn(`[skip] missing source: ${from}`);
    missing++;
    continue;
  }
  mkdirSync(dirname(dst), { recursive: true });
  if (existsSync(dst) && statSync(src).mtimeMs <= statSync(dst).mtimeMs) {
    skipped++;
    continue;
  }
  copyFileSync(src, dst);
  console.log(`[copy] ${from} -> ${to}`);
  copied++;
}

console.log(`Done. copied=${copied} skipped=${skipped} missing=${missing}`);
