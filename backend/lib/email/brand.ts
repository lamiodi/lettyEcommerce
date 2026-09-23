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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost"))
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.houseofletty.com";
  return `${siteUrl.replace(/\/$/, "")}/brand/letty-logo-light.png`;
}

/** Dark lockup used by the editorial order-confirmation email. */
export function darkLogoUrl(): string {
  if (process.env.EMAIL_DARK_LOGO_URL) return process.env.EMAIL_DARK_LOGO_URL;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost"))
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.houseofletty.com";
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
  const base = (siteUrl && !siteUrl.includes("localhost"))
    ? siteUrl
    : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "https://www.houseofletty.com");
  return `${base.replace(/\/$/, "")}/email/order-confirmation-banner.jpg`;
}

export function maisonIconUrl(name: string, siteUrl?: string): string {
  const base = (siteUrl && !siteUrl.includes("localhost"))
    ? siteUrl
    : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "https://www.houseofletty.com");
  return `${base.replace(/\/$/, "")}/email/icons/${name}`;
}

const DEFAULT_CDN_HOST = "res.cloudinary.com";
const DEFAULT_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "jtsxpm1l";
const DEFAULT_SITE_URL = "https://www.houseofletty.com";

/**
 * Format and sanitize an image URL for bulletproof rendering in all email clients
 * (Gmail via Google Image Proxy, Outlook desktop Word engine, Apple Mail, Yahoo).
 *
 * 1. Resolves relative paths (/products/..., /ima/..., /images/...) to public Cloudinary CDN
 *    or canonical production site HTTPS URL so local/dev environments don't output localhost URLs.
 * 2. Properly percent-encodes spaces (' ' -> '%20'), parentheses, and special characters
 *    in the URL path so email proxies don't truncate the URL.
 * 3. In Cloudinary URLs, swaps `f_auto` to `f_jpg,q_auto` to guarantee support on Outlook
 *    desktop (which does not support WebP or AVIF).
 */
export function formatEmailImageUrl(rawUrl?: string | null, siteUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let url = trimmed;

  if (/^https?:\/\//i.test(url)) {
    if (/^https?:\/\/localhost(:\d+)?/i.test(url)) {
      const pathPart = url.replace(/^https?:\/\/localhost(:\d+)?/i, "");
      url = `https://${DEFAULT_CDN_HOST}/${DEFAULT_CLOUD_NAME}/image/upload/f_jpg,q_auto/v1/letty${pathPart.startsWith("/") ? pathPart : `/${pathPart}`}`;
    }
  } else {
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    if (cleanPath.startsWith("/products/") || cleanPath.startsWith("/ima/") || cleanPath.startsWith("/images/")) {
      url = `https://${DEFAULT_CDN_HOST}/${DEFAULT_CLOUD_NAME}/image/upload/f_jpg,q_auto/v1/letty${cleanPath}`;
    } else {
      const base = (siteUrl && !siteUrl.includes("localhost"))
        ? siteUrl.replace(/\/$/, "")
        : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
            ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
            : DEFAULT_SITE_URL);
      url = `${base}${cleanPath}`;
    }
  }

  if (url.includes("res.cloudinary.com") && url.includes("f_auto")) {
    url = url.replace(/f_auto/g, "f_jpg");
  }

  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)).replace(/%2C/g, ","))
      .join("/");
    return parsed.toString();
  } catch {
    return encodeURI(url).replace(/#/g, "%23");
  }
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
