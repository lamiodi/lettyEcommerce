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

export const BRAND = {
  ink: "#32150D",
  ivory: "#EDE5DA",
  stone: "#6E5A4E",
  gold: "#A98A5F",
  line: "#E2D9CE",
  surface: "#FFFFFF",
  bg: "#EDE5DA",
} as const;

/** Absolute URL of the Letty lockup, embedded in every email header. */
export function logoUrl(): string {
  if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
  return `${siteUrl.replace(/\/$/, "")}/brand/letty-logo-light.png`;
}

/** Wordmark label next to the emblem in the email header. */
export function brandName(): string {
  return process.env.EMAIL_BRAND_NAME || "LETTY";
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
  if (process.env.EMAIL_INLINE_FONTS !== "1") {
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
