/**
 * Shared email layout for every Letty transactional email.
 *
 * Renders a single column, max-width 600px, on the brand ivory background.
 * Header: Letty emblem + wordmark. Footer: contact line, concierge email,
 * copyright. Body styles consume the brand palette and font stack.
 *
 * Clients (Gmail, Outlook, Apple Mail) block remote fonts, so brand fonts
 * are inlined as base64 via `fontStyles()` (opt-in via EMAIL_INLINE_FONTS).
 *
 * The function is intentionally tiny and side-effect free. Each template
 * provides its own `body` and `subject`.
 */
import {
  BRAND,
  brandName,
  darkLogoUrl,
  fontStyles,
  logoUrl,
  SYSTEM_BODY_STACK,
  SYSTEM_HEADING_STACK,
} from "./brand";

export interface LayoutOptions {
  /** Pre-escaped HTML for the email's main content. */
  body: string;
  /** Text-only fallback for clients that don't render HTML. */
  text: string;
  /** Email subject line. */
  subject: string;
  /** Optional preheader (preview text in inbox). */
  preheader?: string;
}

export interface EditorialOrderLayoutOptions extends LayoutOptions {
  /** Absolute URL: email clients cannot load repository-relative assets. */
  bannerUrl: string;
  siteUrl: string;
}

/** Escape a string for safe interpolation into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The base <style> block applied to every email. */
function buildBaseStyles(): string {
  const hasBrandFonts = process.env.EMAIL_INLINE_FONTS === "1";
  const bodyStack = hasBrandFonts ? "'Satoshi', " + SYSTEM_BODY_STACK : SYSTEM_BODY_STACK;
  const headingStack = hasBrandFonts ? "'Zodiak', " + SYSTEM_HEADING_STACK : SYSTEM_HEADING_STACK;
  return `
    ${fontStyles()}
    body { margin: 0; padding: 0; background: ${BRAND.bg}; color: ${BRAND.ink};
           font-family: ${bodyStack}; -webkit-font-smoothing: antialiased; }
    a { color: ${BRAND.ink}; }
    .preheader { display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${BRAND.bg}; }
    .container { max-width: 600px; margin: 0 auto; background: ${BRAND.surface}; }
    .header { padding: 32px 40px 26px; text-align: center; border-bottom: 1px solid ${BRAND.line}; background: ${BRAND.ivory}; }
    .header .logo { display: inline-block; }
    .content { padding: 40px; }
    h1, h2, h3 { font-family: ${headingStack}; font-weight: 500; color: ${BRAND.ink}; margin: 0 0 16px; letter-spacing: -0.01em; }
    h1 { font-size: 32px; line-height: 1.15; margin-top: 0; }
    h2 { font-size: 20px; line-height: 1.3; margin-top: 32px; }
    h3 { font-size: 16px; line-height: 1.4; margin-top: 24px; }
    p { font-size: 15px; line-height: 1.7; color: ${BRAND.stone}; margin: 0 0 18px; }
    p:last-child { margin-bottom: 0; }
    p.lead { color: ${BRAND.ink}; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 14px 0; border-bottom: 1px solid ${BRAND.line}; font-size: 14px; color: ${BRAND.ink}; vertical-align: top; }
    th { color: ${BRAND.stone}; font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.18em; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td { font-weight: 600; border-top: 1px solid ${BRAND.ink}; border-bottom: none; padding-top: 18px; }
    .divider { height: 1px; background: ${BRAND.line}; margin: 32px 0; }
    .button { display: inline-block; background: ${BRAND.ink}; color: ${BRAND.ivory};
              padding: 16px 36px; text-decoration: none; font-size: 12px;
              letter-spacing: 0.24em; text-transform: uppercase; margin: 8px 0 24px; }
    .button.gold { background: ${BRAND.gold}; color: ${BRAND.ink}; }
    .button.line { background: transparent; color: ${BRAND.ink};
                   border-top: 1px solid ${BRAND.ink}; border-bottom: 1px solid ${BRAND.ink};
                   padding: 14px 34px; }
    .accent { color: ${BRAND.gold}; }
    .muted { color: ${BRAND.stone}; }
    .address { font-style: normal; line-height: 1.7; color: ${BRAND.stone}; }
    .footer { padding: 32px 40px; text-align: center; font-size: 12px; color: ${BRAND.stone}; border-top: 1px solid ${BRAND.line}; }
    .footer p { font-size: 12px; line-height: 1.7; margin: 0 0 6px; }
    .footer a { color: ${BRAND.stone}; text-decoration: underline; text-underline-offset: 3px; }
    @media only screen and (max-width: 620px) {
      .content { padding: 28px 22px !important; }
      .header { padding: 28px 22px 22px !important; }
      .footer { padding: 24px 22px !important; }
      h1 { font-size: 26px !important; }
    }
  `;
}

/** Renders the full HTML document for the email. */
export function renderLayout(opts: LayoutOptions): { html: string; text: string; subject: string } {
  const wordmark = brandName();
  const logo = logoUrl();
  const preheader = opts.preheader
    ? `<span class="preheader">${escapeHtml(opts.preheader)}</span>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>${escapeHtml(opts.subject)}</title>
    <style>${buildBaseStyles()}</style>
  </head>
  <body>
    ${preheader}
    <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:${BRAND.surface};">
      <tr>
        <td class="header">
          <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com")}" class="logo" style="display:inline-block;">
            <img src="${escapeHtml(logo)}" alt="${escapeHtml(wordmark)}" width="56" height="79" style="display:block;border:0;outline:none;text-decoration:none;width:56px;height:79px;">
          </a>
        </td>
      </tr>
      <tr>
        <td class="content">${opts.body}</td>
      </tr>
      <tr>
        <td class="footer">
          <p>${escapeHtml(wordmark)} &middot; Luxury Beauty, Fragrance, Fashion &amp; Eyewear</p>
          <p>12 Rue Saint-Honor&eacute;, Paris &middot; Lagos &middot; New York</p>
          <p>Concierge: <a href="mailto:lettybeautyco@gmail.com">lettybeautyco@gmail.com</a> &middot; <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com")}">houseofletty.com</a></p>
          <p style="margin-top:14px;">&copy; ${new Date().getFullYear()} ${escapeHtml(wordmark)}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { html, text: opts.text, subject: opts.subject };
}

/**
 * Dark editorial shell reserved for the paid-order receipt. Its full-width
 * campaign image and section dividers mirror a luxury maison confirmation,
 * while the shared light shell remains unchanged for operational emails.
 */
export function renderEditorialOrderLayout(
  opts: EditorialOrderLayoutOptions,
): { html: string; text: string; subject: string } {
  const wordmark = brandName();
  const logo = darkLogoUrl();
  const preheader = opts.preheader
    ? `<span class="preheader">${escapeHtml(opts.preheader)}</span>`
    : "";
  const bodyStack = process.env.EMAIL_INLINE_FONTS === "1"
    ? `'Satoshi', ${SYSTEM_BODY_STACK}`
    : SYSTEM_BODY_STACK;
  const headingStack = process.env.EMAIL_INLINE_FONTS === "1"
    ? `'Zodiak', ${SYSTEM_HEADING_STACK}`
    : SYSTEM_HEADING_STACK;
  const siteUrl = opts.siteUrl.replace(/\/$/, "");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${escapeHtml(opts.subject)}</title>
    <style>
      ${fontStyles()}
      body { margin:0; padding:0; background:#130f0e; color:#f3ebe2; font-family:${bodyStack}; -webkit-font-smoothing:antialiased; }
      a { color:#f3ebe2; }
      .preheader { display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#130f0e; }
      .email-shell { width:100%; max-width:640px; margin:0 auto; background:#211a17; }
      .brand-header { background:#32150d; padding:26px 40px 20px; text-align:center; }
      .brand-header img { display:block; width:74px; height:auto; margin:0 auto; border:0; }
      .nav { background:#32150d; border-top:1px solid #56382f; border-bottom:1px solid #56382f; }
      .nav td { width:33.333%; padding:15px 8px; text-align:center; }
      .nav a { color:#eaded2; font-size:10px; line-height:1; font-weight:600; letter-spacing:.2em; text-decoration:none; text-transform:uppercase; }
      .hero { display:block; width:100%; max-width:640px; height:auto; border:0; }
      .editorial-copy { padding:44px 48px 38px; }
      .editorial-copy h1 { margin:0 0 28px; color:#f7efe7; font-family:${headingStack}; font-size:27px; line-height:1.25; font-weight:400; }
      .editorial-copy p { margin:0 0 22px; color:#cdbfb5; font-family:${headingStack}; font-size:17px; line-height:1.65; }
      .editorial-copy .signature { margin-top:30px; margin-bottom:0; }
      .editorial-copy .wordmark { color:#f0c986; }
      .section-title { padding:16px 20px; border-top:1px solid #4a3c36; border-bottom:1px solid #4a3c36; color:#e8ddd3; font-family:${headingStack}; font-size:19px; line-height:1.2; font-weight:400; text-align:center; }
      .section-content { padding:30px 36px 34px; }
      .info-grid { width:100%; border-collapse:collapse; margin:0; }
      .info-grid td { width:50%; padding:8px 20px 24px 0; color:#cdbfb5; font-size:14px; line-height:1.65; vertical-align:top; }
      .info-grid td + td { padding-right:0; padding-left:20px; }
      .info-grid strong { display:block; margin-bottom:7px; color:#f4ebe2; font-family:${headingStack}; font-size:18px; line-height:1.35; font-weight:600; }
      .info-grid .label { color:#94857c; }
      .product-table, .total-table { width:100%; border-collapse:collapse; margin:0; }
      .product-table td { padding:22px 0; border-bottom:1px solid #413630; color:#cdbfb5; font-size:14px; line-height:1.55; vertical-align:middle; }
      .product-table .product-image { width:112px; padding-right:22px; }
      .product-table img { display:block; width:96px; height:112px; object-fit:cover; border:0; background:#efe3d6; }
      .product-table .product-name { color:#f4ebe2; font-family:${headingStack}; font-size:20px; line-height:1.35; }
      .product-table .variant { color:#9f9188; font-size:12px; }
      .product-table .product-price { padding-left:18px; color:#f4ebe2; text-align:right; white-space:nowrap; }
      .total-table { margin-top:22px; }
      .total-table td { padding:7px 0; color:#bcaea5; font-size:14px; line-height:1.45; }
      .total-table td:last-child { text-align:right; white-space:nowrap; }
      .total-table .grand-total td { padding-top:15px; border-top:1px solid #66544b; color:#f7efe7; font-size:17px; font-weight:700; }
      .order-button { display:block; width:230px; margin:28px auto 2px; padding:14px 16px; border-top:1px solid #d8c9be; border-bottom:1px solid #d8c9be; color:#f4ebe2; font-size:10px; font-weight:600; letter-spacing:.2em; text-align:center; text-decoration:none; text-transform:uppercase; }
      .footer { padding:30px 36px; border-top:1px solid #4a3c36; color:#91837b; text-align:center; }
      .footer p { margin:0 0 7px; color:#91837b; font-size:11px; line-height:1.65; }
      .footer a { color:#b9aaa1; text-decoration:underline; text-underline-offset:3px; }
      @media only screen and (max-width:640px) {
        .brand-header { padding:22px 20px 17px !important; }
        .brand-header img { width:62px !important; }
        .nav a { font-size:9px !important; letter-spacing:.12em !important; }
        .editorial-copy { padding:34px 24px 30px !important; }
        .editorial-copy h1 { font-size:24px !important; }
        .editorial-copy p { font-size:16px !important; }
        .section-content { padding:24px 22px 28px !important; }
        .info-grid td { display:block !important; width:100% !important; padding:7px 0 22px !important; }
        .product-table .product-image { width:88px !important; padding-right:14px !important; }
        .product-table img { width:76px !important; height:92px !important; }
        .product-table .product-name { font-size:17px !important; }
        .product-table .product-price { display:block !important; padding:5px 0 0 !important; text-align:left !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#130f0e;color:#f3ebe2;">
    ${preheader}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#130f0e;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:640px;margin:0 auto;background:#211a17;">
            <tr>
              <td class="brand-header" style="background:#32150d;padding:26px 40px 20px;text-align:center;">
                <a href="${escapeHtml(siteUrl)}" style="display:inline-block;">
                  <img src="${escapeHtml(logo)}" alt="${escapeHtml(wordmark)}" width="74" style="display:block;width:74px;height:auto;margin:0 auto;border:0;">
                </a>
              </td>
            </tr>
            <tr>
              <td class="nav" style="background:#32150d;border-top:1px solid #56382f;border-bottom:1px solid #56382f;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td><a href="${escapeHtml(`${siteUrl}/shop?category=makeup-beauty`)}">Beauty</a></td>
                    <td><a href="${escapeHtml(`${siteUrl}/shop?category=fragrance`)}">Fragrance</a></td>
                    <td><a href="${escapeHtml(`${siteUrl}/shop?category=eyewear`)}">Eyewear</a></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0;line-height:0;">
                <a href="${escapeHtml(`${siteUrl}/shop`)}" style="display:block;">
                  <img src="${escapeHtml(opts.bannerUrl)}" alt="LETTY Beauty collection" width="640" class="hero" style="display:block;width:100%;max-width:640px;height:auto;border:0;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">${opts.body}</td>
            </tr>
            <tr>
              <td class="footer" style="padding:30px 36px;border-top:1px solid #4a3c36;color:#91837b;text-align:center;">
                <p>${escapeHtml(wordmark)} &middot; Luxury Beauty, Fragrance, Fashion &amp; Eyewear</p>
                <p>Concierge: <a href="mailto:lettybeautyco@gmail.com">lettybeautyco@gmail.com</a> &middot; <a href="${escapeHtml(siteUrl)}">houseofletty.com</a></p>
                <p style="margin-top:13px;">&copy; ${new Date().getFullYear()} ${escapeHtml(wordmark)}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text: opts.text, subject: opts.subject };
}
