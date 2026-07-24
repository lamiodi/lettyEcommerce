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
import { BRAND, brandName, fontStyles, logoUrl, SYSTEM_BODY_STACK, SYSTEM_HEADING_STACK } from "./brand";
import { env } from "@/lib/env";

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

/** Escape a string for safe interpolation into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The wordmark label next to the emblem — always uppercase, tracked. */
const wordmarkStyle = `
  font-family: 'Zodiak', ${SYSTEM_HEADING_STACK};
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 0.32em;
  color: ${BRAND.ink};
  text-transform: uppercase;
  text-decoration: none;
`;

/** The base <style> block applied to every email. */
function buildBaseStyles(): string {
  const hasBrandFonts = env().EMAIL_INLINE_FONTS === "1";
  const bodyStack = hasBrandFonts ? "'Satoshi', " + SYSTEM_BODY_STACK : SYSTEM_BODY_STACK;
  const headingStack = hasBrandFonts ? "'Zodiak', " + SYSTEM_HEADING_STACK : SYSTEM_HEADING_STACK;
  return `
    ${fontStyles()}
    body { margin: 0; padding: 0; background: ${BRAND.bg}; color: ${BRAND.ink};
           font-family: ${bodyStack}; -webkit-font-smoothing: antialiased; }
    a { color: ${BRAND.ink}; }
    .preheader { display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${BRAND.bg}; }
    .container { max-width: 600px; margin: 0 auto; background: ${BRAND.surface}; }
    .header { padding: 36px 40px 28px; text-align: center; border-bottom: 1px solid ${BRAND.line}; }
    .header .logo { display: inline-block; vertical-align: middle; }
    .header .wordmark { display: inline-block; vertical-align: middle; margin-left: 12px; }
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

// Local copy of env() to avoid a circular import through brand.ts.

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
          <a href="${escapeHtml(env().NEXT_PUBLIC_SITE_URL)}" class="logo" style="display:inline-block;vertical-align:middle;">
            <img src="${escapeHtml(logo)}" alt="${escapeHtml(wordmark)}" width="36" height="36" style="display:block;border:0;outline:none;text-decoration:none;width:36px;height:36px;">
          </a>
          <span class="wordmark" style="${wordmarkStyle}">${escapeHtml(wordmark)}</span>
        </td>
      </tr>
      <tr>
        <td class="content">${opts.body}</td>
      </tr>
      <tr>
        <td class="footer">
          <p>${escapeHtml(wordmark)} &middot; Luxury Hair, Beauty, Fragrance &amp; Fashion</p>
          <p>12 Rue Saint-Honor&eacute;, Paris &middot; Lagos &middot; New York</p>
          <p>Concierge: <a href="mailto:concierge@letty.com">concierge@letty.com</a> &middot; <a href="${escapeHtml(env().NEXT_PUBLIC_SITE_URL)}">letty.com</a></p>
          <p style="margin-top:14px;">&copy; ${new Date().getFullYear()} ${escapeHtml(wordmark)}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { html, text: opts.text, subject: opts.subject };
}
