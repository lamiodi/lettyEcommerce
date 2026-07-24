/**
 * Brand assets for email templates.
 *
 * - `BRAND`     — the Letty palette (matches `frontend/src/app/globals.css`).
 * - `logoUrl()` — absolute URL of the emblem (overridable via EMAIL_LOGO_URL).
 * - `brandName()` — the wordmark label used in email headers.
 * - `fontStyles()` — @font-face blocks for Satoshi (body) + Zodiak (headings),
 *   with the variable-font files inlined as base64. Adds ~210KB per email,
 *   so opt-in via EMAIL_INLINE_FONTS=1. Falls back to a system stack in dev.
 *
 * Fonts are read from `backend/public/fonts/` at module load and memoized.
 * To populate: copy `frontend/src/fonts/Satoshi-Variable.ttf` and
 * `Zodiak-Variable.ttf` into `backend/public/fonts/`. The build script
 * (or a one-time `cp`) does this — see `scripts/sync-email-assets.mjs`.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";

export const BRAND = {
  ink: "#111111",
  ivory: "#F8F6F2",
  stone: "#5C5C5C",
  gold: "#D8B98A",
  line: "#ECECEC",
  surface: "#FFFFFF",
  bg: "#F8F6F2",
} as const;

/** Absolute URL of the Letty emblem, embedded in every email. */
export function logoUrl(): string {
  const cfg = env();
  if (cfg.EMAIL_LOGO_URL) return cfg.EMAIL_LOGO_URL;
  // Default: same site URL the storefront runs on, served from /brand/.
  return `${cfg.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/brand/letty-emblem.png`;
}

/** Wordmark label next to the emblem in the email header. */
export function brandName(): string {
  return env().EMAIL_BRAND_NAME;
}

/** Resolved absolute path to `backend/public/`. */
function publicDir(): string {
  return join(process.cwd(), "public");
}

function tryReadFont(filename: string): string | null {
  const path = join(publicDir(), "fonts", filename);
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  return buf.toString("base64");
}

let _fontBlock: string | null = null;
let _fontBlockResolved = false;

/**
 * Returns a `<style>` string with @font-face for Satoshi (body) + Zodiak
 * (headings), inlined as base64. Returns "" when fonts are not present or
 * when EMAIL_INLINE_FONTS is off.
 */
export function fontStyles(): string {
  if (_fontBlockResolved) return _fontBlock ?? "";
  _fontBlockResolved = true;
  if (env().EMAIL_INLINE_FONTS !== "1") {
    _fontBlock = "";
    return _fontBlock;
  }
  const satoshi = tryReadFont("Satoshi-Variable.ttf");
  const zodiak = tryReadFont("Zodiak-Variable.ttf");
  if (!satoshi || !zodiak) {
    _fontBlock = "";
    return _fontBlock;
  }
  _fontBlock = `
    @font-face {
      font-family: 'Satoshi';
      font-style: normal;
      font-weight: 300 900;
      font-display: swap;
      src: url(data:font/ttf;base64,${satoshi}) format('truetype');
    }
    @font-face {
      font-family: 'Zodiak';
      font-style: normal;
      font-weight: 300 900;
      font-display: swap;
      src: url(data:font/ttf;base64,${zodiak}) format('truetype');
    }
  `;
  return _fontBlock;
}

/** System fallback stack used when brand fonts are not inlined. */
export const SYSTEM_BODY_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const SYSTEM_HEADING_STACK =
  "Georgia, 'Times New Roman', 'Apple Garamond', serif";
