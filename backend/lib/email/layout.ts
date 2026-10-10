/**
 * Shared email layout for every LETTY transactional email.
 *
 * Single Maison shell: `renderMaisonEmailLayout()` (nav, banner, body,
 * customer-care box, perks bar, social/monogram footer). Every template in
 * ./templates.ts defers to it; there is no second layout anymore.
 *
 * Clients (Gmail, Outlook, Apple Mail) block remote fonts, so brand fonts
 * are inlined as base64 via `fontStyles()` (opt-in via EMAIL_INLINE_FONTS).
 */
import {
  fontStyles,
  MAISON_COLORS,
  MAISON_CONFIG,
  maisonBannerUrl,
  SYSTEM_BODY_STACK,
  SYSTEM_HEADING_STACK,
} from "./brand";

/** Escape a string for safe interpolation into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ====================================================================== */
/*  Maison Francis Kurkdjian Inspired Luxury Layout System                 */
/* ====================================================================== */

export interface MaisonLayoutOptions {
  subject: string;
  preheader?: string;
  body: string;
  text: string;
  siteUrl?: string;
  bannerUrl?: string | null;
  showBanner?: boolean;
  showNav?: boolean;
  showCustomerCare?: boolean;
  advisorText?: string;
  showPerks?: boolean;
  showSocial?: boolean;
  showSeal?: boolean;
  showFooter?: boolean;
  unsubscribeUrl?: string;
  webviewUrl?: string;
}

/** Outlined minimalist luxury action button matching Maison Francis Kurkdjian */
export function maisonLineButton(label: string, href: string): string {
  return `<div style="text-align: center; margin: 34px 0 30px;">
    <a href="${escapeHtml(href)}" style="display: inline-block; border: 1px solid ${MAISON_COLORS.ink}; color: ${MAISON_COLORS.ink}; background: #FFFFFF; padding: 14px 42px; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; text-decoration: none;">
      ${escapeHtml(label)}
    </a>
  </div>`;
}

/** Bordered Customer Care advisor box */
export function maisonCustomerCareBox(advisorText?: string): string {
  const phone = MAISON_CONFIG.advisorPhone;
  const hours = MAISON_CONFIG.advisorHours;
  const email = MAISON_CONFIG.advisorEmail;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 36px 0 28px; border: 1px solid ${MAISON_COLORS.line}; background: #FFFFFF;">
    <tr>
      <td style="padding: 24px 28px;">
        <h3 style="margin: 0 0 10px; font-family: ${SYSTEM_HEADING_STACK}; font-size: 18px; font-weight: 500; color: ${MAISON_COLORS.ink};">Customer Care</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.stone};">
          ${advisorText || `Our customer care team is available by phone on <a href="tel:${phone.replace(/[^\d+]/g, "")}" style="color:${MAISON_COLORS.ink};text-decoration:none;font-weight:500;">${phone}</a>, ${hours}. You can also contact us by <a href="mailto:${email}" style="color:${MAISON_COLORS.ink};text-decoration:underline;">email</a>.`}
        </p>
      </td>
    </tr>
  </table>`;
}

/** Value Propositions with clean line icons */
export function maisonPerksBar(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  // No shipping perk here: free shipping was removed — every order pays the
  // quoted rate, so claiming it in a receipt would be a false promise.
  const perks = [
    { icon: `${base}/email/icons/perk-adviser.png`, label: "A customer adviser is<br>at your disposal" },
    { icon: `${base}/email/icons/perk-giftbox.png`, label: "Gift-box in the colors<br>of the Maison" },
    { icon: `${base}/email/icons/perk-samples.png`, label: "2 samples offered<br>subject to conditions" },
  ];

  const cols = perks.map((p) => `
    <td align="center" valign="top" style="width: 33%; padding: 12px 6px;">
      <img src="${p.icon}" alt="" width="48" height="48" style="display:block;margin:0 auto 10px;width:48px;height:48px;border:0;">
      <div style="margin:0;font-size:11px;line-height:1.45;color:${MAISON_COLORS.stone};text-align:center;font-family:${SYSTEM_BODY_STACK};">${p.label}</div>
    </td>
  `).join("");

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 36px 0 28px;">
    <tr>${cols}</tr>
  </table>`;
}

/** Social channels, brand seal, footer links, and legal notice */
export function maisonSocialAndFooter(siteUrl: string, unsubscribeUrl?: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const seal = `${base}/email/icons/maison-seal.png`;

  const unsubscribeBlock = unsubscribeUrl
    ? `<p style="margin: 0 0 8px; font-size: 11px; line-height: 1.6; color: ${MAISON_COLORS.muted};">
        If you want to stop receiving communications about products and services from LETTY, <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MAISON_COLORS.stone};text-decoration:underline;">unsubscribe here</a>.
       </p>`
    : "";

  return `
  <!-- Social Channels — mirrors the storefront's SOCIAL_LINKS (Instagram only;
       add Facebook/YouTube here only once the handles are confirmed real) -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0 24px;">
    <tr>
      <td align="center" style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; font-weight: 500;">
        <a href="https://instagram.com/lettybeautyofficial" style="color: ${MAISON_COLORS.ink}; text-decoration: none;">INSTAGRAM</a>
      </td>
    </tr>
  </table>

  <!-- Monogram Seal -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0 28px;">
    <tr>
      <td align="center">
        <a href="${escapeHtml(base)}" style="display:inline-block;text-decoration:none;">
          <img src="${seal}" alt="LETTY" width="38" height="38" style="display:block;margin:0 auto;width:38px;height:38px;border:0;">
        </a>
      </td>
    </tr>
  </table>

  <!-- Footer Navigation Links -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 28px;">
    <tr>
      <td align="center" style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; font-weight: 500;">
        <a href="${base}/faq" style="color: ${MAISON_COLORS.ink}; text-decoration: none;">FAQ</a>
        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <a href="${base}/contact" style="color: ${MAISON_COLORS.ink}; text-decoration: none;">CONTACT US</a>
        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <a href="${base}/terms" style="color: ${MAISON_COLORS.ink}; text-decoration: none;">TERMS &amp; CONDITIONS</a>
        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <a href="${base}/privacy" style="color: ${MAISON_COLORS.ink}; text-decoration: none;">PRIVACY POLICY</a>
      </td>
    </tr>
  </table>

  <!-- Legal Notice & DPO -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0 32px; border-top: 1px solid ${MAISON_COLORS.line}; padding-top: 24px;">
    <tr>
      <td align="center" style="font-size: 10px; line-height: 1.65; color: ${MAISON_COLORS.muted}; text-align: center;">
        <p style="margin: 0 0 8px;">
          To know more on the processing of your personal data as well as to know your rights, you can consult our <a href="${base}/privacy" style="color:${MAISON_COLORS.stone};text-decoration:underline;">Privacy Policy</a> or contact us at <a href="mailto:${MAISON_CONFIG.dpoEmail}" style="color:${MAISON_COLORS.stone};text-decoration:underline;">${MAISON_CONFIG.dpoEmail}</a>.
        </p>
        ${unsubscribeBlock}
        <p style="margin: 0; color: ${MAISON_COLORS.muted};">
          ${escapeHtml(MAISON_CONFIG.legalAddress)}
        </p>
      </td>
    </tr>
  </table>`;
}

/** 0 to 10 Interactive Rating Scale matching PDF 3 */
export function maisonRatingScale(opts: { question?: string; siteUrl: string; orderNumber?: string }): string {
  const base = opts.siteUrl.replace(/\/$/, "");
  const orderParam = opts.orderNumber ? `&order=${encodeURIComponent(opts.orderNumber)}` : "";
  const question = opts.question || "Would you recommend LETTY to your friends and family?";

  const boxes = Array.from({ length: 11 }, (_, i) => {
    const url = `${base}/feedback?score=${i}${orderParam}`;
    return `<td align="center" valign="middle" style="width: 38px; height: 38px; border: 1px solid ${MAISON_COLORS.ink}; background: #FFFFFF; padding: 0;">
      <a href="${escapeHtml(url)}" style="display: block; width: 100%; height: 38px; line-height: 38px; color: ${MAISON_COLORS.ink}; text-decoration: none; font-family: ${SYSTEM_BODY_STACK}; font-size: 15px; font-weight: 500;">
        ${i}
      </a>
    </td>`;
  }).join('<td style="width: 4px;"></td>');

  return `
  <div style="margin: 36px 0 32px; text-align: center;">
    <h3 style="margin: 0 0 24px; font-family: ${SYSTEM_HEADING_STACK}; font-size: 18px; font-weight: 400; color: ${MAISON_COLORS.ink}; line-height: 1.35;">
      ${escapeHtml(question)}
    </h3>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
      <tr>${boxes}</tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 460px; margin: 10px auto 0;">
      <tr>
        <td align="left" style="font-size: 12px; color: ${MAISON_COLORS.stone}; font-family: ${SYSTEM_BODY_STACK};">0 - Not at all</td>
        <td align="right" style="font-size: 12px; color: ${MAISON_COLORS.stone}; font-family: ${SYSTEM_BODY_STACK};">10 - Absolutely</td>
      </tr>
    </table>
  </div>`;
}

/** Structured "Order Information" grid matching PDF 2 */
export function maisonOrderInfoGrid(opts: {
  orderNumber: string;
  orderPlaced?: string;
  deliveryMethod?: string;
  deliveryDate?: string;
  shippingAddressHtml?: string;
  billingAddressHtml?: string;
}): string {
  const metaRows = [
    `<tr><td style="padding: 2px 0; font-size: 13px; color: ${MAISON_COLORS.stone};"><strong style="color:${MAISON_COLORS.ink};font-weight:500;">Order number:</strong> ${escapeHtml(opts.orderNumber)}</td></tr>`,
    opts.orderPlaced ? `<tr><td style="padding: 2px 0; font-size: 13px; color: ${MAISON_COLORS.stone};"><strong style="color:${MAISON_COLORS.ink};font-weight:500;">Order placed:</strong> ${escapeHtml(opts.orderPlaced)}</td></tr>` : "",
    opts.deliveryMethod ? `<tr><td style="padding: 2px 0; font-size: 13px; color: ${MAISON_COLORS.stone};"><strong style="color:${MAISON_COLORS.ink};font-weight:500;">Delivery method:</strong> ${escapeHtml(opts.deliveryMethod)}</td></tr>` : "",
    opts.deliveryDate ? `<tr><td style="padding: 2px 0; font-size: 13px; color: ${MAISON_COLORS.stone};"><strong style="color:${MAISON_COLORS.ink};font-weight:500;">Delivery date:</strong> ${escapeHtml(opts.deliveryDate)}</td></tr>` : "",
  ].filter(Boolean).join("");

  const addresses = (opts.shippingAddressHtml || opts.billingAddressHtml)
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        ${opts.shippingAddressHtml ? `
        <td valign="top" style="width: 50%; padding-right: 16px;">
          <h4 style="margin: 0 0 8px; font-family: ${SYSTEM_HEADING_STACK}; font-size: 15px; font-weight: 500; color: ${MAISON_COLORS.ink};">Shipping address</h4>
          <div style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.stone}; font-style: normal;">
            ${opts.shippingAddressHtml}
          </div>
        </td>` : ""}
        ${opts.billingAddressHtml ? `
        <td valign="top" style="width: 50%; padding-left: 16px;">
          <h4 style="margin: 0 0 8px; font-family: ${SYSTEM_HEADING_STACK}; font-size: 15px; font-weight: 500; color: ${MAISON_COLORS.ink};">Billing address</h4>
          <div style="font-size: 13px; line-height: 1.6; color: ${MAISON_COLORS.stone}; font-style: normal;">
            ${opts.billingAddressHtml}
          </div>
        </td>` : ""}
      </tr>
    </table>`
    : "";

  return `
  <div style="margin: 36px 0 28px;">
    <h3 style="margin: 0 0 14px; font-family: ${SYSTEM_HEADING_STACK}; font-size: 19px; font-weight: 400; color: ${MAISON_COLORS.ink};">Order Information</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${metaRows}
    </table>
    ${addresses}
  </div>`;
}

/**
 * Main Maison Francis Kurkdjian-inspired Email Layout
 */
export function renderMaisonEmailLayout(
  opts: MaisonLayoutOptions,
): { html: string; text: string; subject: string } {
  const siteUrl = (opts.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.houseofletty.com").replace(/\/$/, "");
  const bannerUrl = opts.bannerUrl ?? maisonBannerUrl(siteUrl);
  const webviewUrl = opts.webviewUrl || `${siteUrl}/account/orders`;
  const preheader = opts.preheader
    ? `<span class="preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${MAISON_COLORS.canvas};">${escapeHtml(opts.preheader)}</span>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(opts.subject)}</title>
    <style>
      ${fontStyles()}
      body { margin: 0; padding: 0; background-color: ${MAISON_COLORS.canvas}; color: ${MAISON_COLORS.ink}; font-family: ${SYSTEM_BODY_STACK}; -webkit-font-smoothing: antialiased; }
      a { color: ${MAISON_COLORS.ink}; }
      .email-container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
      .editorial-text { font-family: ${SYSTEM_BODY_STACK}; font-size: 14px; line-height: 1.65; color: ${MAISON_COLORS.stone}; }
      .editorial-text a { color: ${MAISON_COLORS.ink}; text-decoration: underline; text-underline-offset: 3px; }
      @media only screen and (max-width: 620px) {
        .email-container { width: 100% !important; }
        .inner-content { padding: 24px 20px !important; }
        .header-nav td { padding: 0 8px !important; font-size: 9px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 20px 0; background-color: ${MAISON_COLORS.canvas}; color: ${MAISON_COLORS.ink}; font-family: ${SYSTEM_BODY_STACK};">
    ${preheader}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${MAISON_COLORS.canvas};">
      <tr>
        <td align="center" style="padding: 0 10px;">
          <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid ${MAISON_COLORS.line};">
            
            <!-- Webview Link -->
            <tr>
              <td align="center" style="padding: 12px 16px 8px; font-size: 11px; color: ${MAISON_COLORS.muted}; font-family: ${SYSTEM_BODY_STACK};">
                If you can’t read this email, <a href="${escapeHtml(webviewUrl)}" style="color: ${MAISON_COLORS.muted}; text-decoration: underline;">click here</a>.
              </td>
            </tr>

            <!-- Category Navigation Bar -->
            ${opts.showNav !== false ? `
            <tr>
              <td align="center" style="padding: 14px 16px; border-top: 1px solid ${MAISON_COLORS.line}; border-bottom: 1px solid ${MAISON_COLORS.line}; background: #FFFFFF;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="header-nav">
                  <tr>
                    <td style="padding: 0 12px;"><a href="${siteUrl}/collections" style="font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; text-decoration: none; font-weight: 600;">COLLECTIONS</a></td>
                    <td style="padding: 0 10px;"><a href="${siteUrl}/shop?category=makeup-beauty" style="font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; text-decoration: none; font-weight: 600;">BEAUTY</a></td>
                    <td style="padding: 0 10px;"><a href="${siteUrl}/shop?category=fragrance" style="font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; text-decoration: none; font-weight: 600;">FRAGRANCE</a></td>
                    <td style="padding: 0 10px;"><a href="${siteUrl}/shop?category=fashion" style="font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; text-decoration: none; font-weight: 600;">FASHION</a></td>
                    <td style="padding: 0 10px;"><a href="${siteUrl}/shop?category=eyewear" style="font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${MAISON_COLORS.ink}; text-decoration: none; font-weight: 600;">EYEWEAR</a></td>
                  </tr>
                </table>
              </td>
            </tr>` : ""}

            <!-- Brand Wordmark Header + Hero Image -->
            ${opts.showBanner !== false && bannerUrl ? `
            <tr>
              <td style="padding: 0; background: #FAF7F2; text-align: center; border-bottom: 1px solid ${MAISON_COLORS.line};">
                <a href="${siteUrl}/shop" style="display: block; text-decoration: none;">
                  <img src="${escapeHtml(bannerUrl)}" alt="Maison LETTY Paris" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                </a>
              </td>
            </tr>` : `
            <tr>
              <td align="center" style="padding: 32px 20px 20px;">
                <a href="${siteUrl}" style="text-decoration: none;">
                  <div style="font-family: ${SYSTEM_HEADING_STACK}; font-size: 26px; line-height: 1.15; color: ${MAISON_COLORS.ink}; letter-spacing: 0.04em;">
                    Maison<br><strong style="font-weight: 600;">LETTY</strong><br><span style="font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase;">Paris</span>
                  </div>
                </a>
              </td>
            </tr>`}

            <!-- Main Body Content -->
            <tr>
              <td class="inner-content" style="padding: 36px 40px 24px;">
                <div class="editorial-text">
                  ${opts.body}
                </div>

                <!-- Customer Care Box -->
                ${opts.showCustomerCare !== false ? maisonCustomerCareBox(opts.advisorText) : ""}

                <!-- 4 Perks Bar -->
                ${opts.showPerks !== false ? maisonPerksBar(siteUrl) : ""}

                <!-- Social Links, Monogram Seal, Footer Navigation & Legal -->
                ${opts.showFooter !== false ? maisonSocialAndFooter(siteUrl, opts.unsubscribeUrl) : ""}
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

