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
  // Production domain as fallback (matches getBackendUrl's pattern): the
  // emblem is served by the storefront at /brand/, never by this backend.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  return `${siteUrl.replace(/\/$/, "")}/brand/letty-logo-light.png`;
}

/** Dark lockup used by the editorial order-confirmation email. */
export function darkLogoUrl(): string {
  if (process.env.EMAIL_DARK_LOGO_URL) return process.env.EMAIL_DARK_LOGO_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  return `${siteUrl.replace(/\/$/, "")}/brand/letty-logo-dark.png`;
}

/** Wordmark label next to the emblem in the email header. */
export function brandName(): string {
  return process.env.EMAIL_BRAND_NAME || "LETTY";
}

export const MAISON_COLORS = {
  canvas: "#F7F5F0",
  surface: "#FFFFFF",
  ink: "#2B2420",
  stone: "#685E56",
  muted: "#968A80",
  line: "#E8E2D9",
  gold: "#A98A5F",
} as const;

export function maisonBannerUrl(siteUrl?: string): string {
  const base = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  return `${base.replace(/\/$/, "")}/email/order-confirmation-banner.jpg`;
}

export function maisonIconUrl(name: string, siteUrl?: string): string {
  const base = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com";
  return `${base.replace(/\/$/, "")}/email/icons/${name}`;
}

export const MAISON_CONFIG = {
  advisorPhone: process.env.EMAIL_ADVISOR_PHONE || "+1 877.734.8632",
  advisorHours: process.env.EMAIL_ADVISOR_HOURS || "Monday to Saturday from 10 am to 7 pm EST",
  advisorEmail: process.env.EMAIL_ADVISOR_EMAIL || "concierge@houseofletty.com",
  dpoEmail: process.env.EMAIL_DPO_EMAIL || "dpo@houseofletty.com",
  legalAddress: process.env.EMAIL_LEGAL_ADDRESS || "LETTY Paris LLC · 12 Rue Saint-Honoré, Paris · New York, NY 10022",
  navLinks: [
    { label: "COLLECTIONS", path: "/collections" },
    { label: "BEAUTY", path: "/shop?category=makeup-beauty" },
    { label: "FRAGRANCE", path: "/shop?category=fragrance" },
    { label: "DISCOVERY SETS", path: "/shop?category=sets" },
  ],
  perks: [
    { icon: "perk-shipping.png", label: "Free shipping with<br>UPS Ground" },
    { icon: "perk-adviser.png", label: "A customer adviser is<br>at your disposal" },
    { icon: "perk-giftbox.png", label: "Gift-box in the colors<br>of the Maison" },
    { icon: "perk-samples.png", label: "2 samples offered<br>subject to conditions" },
  ],
  socialLinks: [
    { label: "INSTAGRAM", url: "https://instagram.com/houseofletty" },
    { label: "FACEBOOK", url: "https://facebook.com/houseofletty" },
    { label: "YOUTUBE", url: "https://youtube.com/@houseofletty" },
  ],
  footerLinks: [
    { label: "FAQ", path: "/faq" },
    { label: "CONTACT US", path: "/contact" },
    { label: "TERMS & CONDITIONS", path: "/terms" },
    { label: "PRIVACY POLICY", path: "/privacy" },
  ],
};


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
