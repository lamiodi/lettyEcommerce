/**
 * Generates high-res retina email icons for the Maison Francis Kurkdjian style perks.
 * Outputs to both frontend/public/email/icons/ and backend/public/email/icons/.
 */
const path = require("node:path");
const fs = require("node:fs");
const sharp = require("../node_modules/sharp");

const ROOT = path.join(__dirname, "..");
const FRONTEND_ICONS = path.join(ROOT, "public", "email", "icons");
const BACKEND_ICONS = path.join(ROOT, "..", "backend", "public", "email", "icons");

fs.mkdirSync(FRONTEND_ICONS, { recursive: true });
fs.mkdirSync(BACKEND_ICONS, { recursive: true });

const strokeColor = "#6E5A4E";
const strokeWidth = 1.3;

const icons = {
  "perk-shipping.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Envelope body -->
    <rect x="10" y="18" width="44" height="28" rx="2" />
    <!-- Flap folds -->
    <path d="M10 20 L32 35 L54 20" />
    <path d="M10 44 L25 32" />
    <path d="M54 44 L39 32" />
    <!-- Delicate central seal -->
    <circle cx="32" cy="35" r="4.5" fill="#FAF6F0" stroke="${strokeColor}" stroke-width="1" />
    <path d="M30 35 L34 35 M32 33 L32 37" stroke="${strokeColor}" stroke-width="0.9" />
    <!-- Speed/motion accents -->
    <path d="M5 28 L8 28" />
    <path d="M4 33 L7 33" />
    <path d="M6 38 L9 38" />
  </svg>`,

  "perk-adviser.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Back speech bubble -->
    <path d="M22 14 H48 C51.3 14 54 16.7 54 20 V34 C54 37.3 51.3 40 48 40 H44 V46 L37 40 H30" stroke-dasharray="2 1" opacity="0.45" />
    <!-- Front main speech bubble -->
    <path d="M12 18 H40 C43.3 18 46 20.7 46 24 V38 C46 41.3 43.3 44 40 44 H22 L15 50 V44 H12 C8.7 44 6 41.3 6 38 V24 C6 20.7 8.7 18 12 18 Z" fill="#FAF6F0" />
    <!-- Monogram 'L' inside adviser bubble -->
    <path d="M23 27 V35 H29" stroke="${strokeColor}" stroke-width="1.4" />
  </svg>`,

  "perk-giftbox.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Box base -->
    <rect x="14" y="26" width="36" height="26" fill="#FAF6F0" />
    <!-- Box lid -->
    <rect x="11" y="20" width="42" height="7" rx="1" fill="#FAF6F0" />
    <!-- Vertical ribbon -->
    <line x1="32" y1="20" x2="32" y2="52" stroke-width="1.4" />
    <!-- Ribbon bow -->
    <path d="M32 20 C28 14 21 14 23 18 C25 21 32 20 32 20 Z" />
    <path d="M32 20 C36 14 43 14 41 18 C39 21 32 20 32 20 Z" />
    <circle cx="32" cy="20" r="1.5" fill="${strokeColor}" />
  </svg>`,

  "perk-samples.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Booklet / card holder in background -->
    <path d="M26 12 H52 V52 H26 Z" fill="#FAF6F0" opacity="0.6" />
    <path d="M26 12 L20 18 V52 H26" opacity="0.6" />
    <!-- Sample vial 1 -->
    <rect x="14" y="24" width="6" height="24" rx="1" fill="#FFFFFF" />
    <rect x="15" y="20" width="4" height="4" fill="#6E5A4E" />
    <line x1="17" y1="18" x2="17" y2="20" stroke-width="1.2" />
    <!-- Sample vial 2 -->
    <rect x="23" y="22" width="6" height="26" rx="1" fill="#FFFFFF" />
    <rect x="24" y="18" width="4" height="4" fill="#6E5A4E" />
    <line x1="26" y1="16" x2="26" y2="18" stroke-width="1.2" />
  </svg>`,

  "maison-seal.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#A98A5F" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="14" y="14" width="36" height="36" rx="1" stroke="#A98A5F" stroke-width="1" />
    <!-- Interlocking monogram -->
    <path d="M26 23 V41 H38" stroke="#A98A5F" stroke-width="1.8" />
    <path d="M30 25 L38 25" stroke="#A98A5F" stroke-width="1.5" />
    <path d="M24 32 L34 32" stroke="#A98A5F" stroke-width="1.2" />
  </svg>`
};

async function main() {
  for (const [name, svgContent] of Object.entries(icons)) {
    const pngName = name.replace(".svg", ".png");
    const svgBuf = Buffer.from(svgContent);

    // Save SVG
    fs.writeFileSync(path.join(FRONTEND_ICONS, name), svgContent);
    fs.writeFileSync(path.join(BACKEND_ICONS, name), svgContent);

    // Render crisp 128x128 PNG (retina display ready)
    const pngBuf = await sharp(svgBuf, { density: 300 })
      .resize(128, 128)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(FRONTEND_ICONS, pngName), pngBuf);
    fs.writeFileSync(path.join(BACKEND_ICONS, pngName), pngBuf);

    console.log(`Generated icon: ${name} -> ${pngName}`);
  }
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
