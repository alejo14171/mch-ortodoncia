// Render the OG image as a 1200x630 PNG so social platforms (WhatsApp, FB,
// LinkedIn, X) actually render the link preview. Uses sharp to rasterize
// an inline SVG with system-font fallbacks (Georgia/Arial).
//
// Run via:    node scripts/gen-og-png.mjs
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "public", "og-default.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A2238"/>
      <stop offset="100%" stop-color="#2D3450"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.18" r="0.55">
      <stop offset="0%" stop-color="#B8965A" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#B8965A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Hairline gold rule top -->
  <line x1="80" y1="70" x2="320" y2="70" stroke="#B8965A" stroke-width="1.5" opacity="0.7"/>

  <!-- Eyebrow -->
  <text x="80" y="105" font-family="Arial, Helvetica, sans-serif" font-size="17" letter-spacing="4" font-weight="500" fill="#B8965A">
    ORTODONCIA · PEREIRA · DESDE 2000
  </text>

  <!-- Headline (3 stacked lines for legibility) -->
  <text x="80" y="210" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="400" fill="#F7F2EA" letter-spacing="-1">
    Sonrisas que
  </text>
  <text x="80" y="298" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="400" font-style="italic" fill="#B8965A" letter-spacing="-1">
    respiran tranquilidad.
  </text>

  <!-- Sub copy -->
  <text x="80" y="395" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#F7F2EA" opacity="0.8">
    Dra. María Claudia Huertas — Ortodoncia y retratamientos.
  </text>
  <text x="80" y="430" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#F7F2EA" opacity="0.8">
    Pereira, Colombia · Más de 25 años atendiendo casos complejos.
  </text>

  <!-- Bottom hairline rule -->
  <line x1="80" y1="510" x2="1120" y2="510" stroke="#B8965A" stroke-width="0.6" opacity="0.45"/>

  <!-- Brand mark -->
  <text x="80" y="572" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="400" fill="#F7F2EA" letter-spacing="-1">m<tspan font-style="italic" fill="#B8965A">c</tspan>h</text>
  <text x="200" y="568" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="3" font-weight="600" fill="#F7F2EA" opacity="0.7">
    ORTODONCIA · PEREIRA
  </text>
  <text x="1120" y="572" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#B8965A" font-weight="500" text-anchor="end" letter-spacing="1">
    mchuertasortodoncista.com
  </text>

  <!-- Decorative gold dots -->
  <circle cx="1080" cy="100" r="4" fill="#B8965A"/>
  <circle cx="1100" cy="125" r="2.5" fill="#B8965A" opacity="0.6"/>
  <circle cx="1062" cy="140" r="2" fill="#B8965A" opacity="0.4"/>
</svg>`;

const buffer = Buffer.from(svg);

await sharp(buffer, { density: 144 })
  .png({ quality: 90, compressionLevel: 9 })
  .resize(1200, 630, { fit: "cover" })
  .toFile(outPath);

console.log(`✓ Wrote ${outPath}`);

const jpgPath = outPath.replace(/\.png$/, ".jpg");
await sharp(buffer, { density: 144 })
  .jpeg({ quality: 88, mozjpeg: true })
  .resize(1200, 630, { fit: "cover" })
  .flatten({ background: "#1A2238" })
  .toFile(jpgPath);

console.log(`✓ Wrote ${jpgPath}`);
