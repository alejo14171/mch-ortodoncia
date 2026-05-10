// Clean case SVGs: strip text labels, contain teeth within panel via real <clipPath>.
// Run with: node scripts/rebuild-cases.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "src", "assets", "casos");
const files = readdirSync(dir).filter((f) => f.endsWith(".svg") && f.startsWith("caso-"));

for (const file of files) {
  const path = join(dir, file);
  let svg = readFileSync(path, "utf8");

  const ariaMatch = svg.match(/aria-label="([^"]+)"/);
  const ariaLabel = ariaMatch ? ariaMatch[1] : basename(file, ".svg");

  // Pull out the dental illustration groups for ANTES and DESPUÉS.
  // Original structure inside each panel:
  //   <g transform="translate(0, 30) scale(0.95)">
  //     ...teeth...
  //     <text>SUP</text><text>INF</text>
  //   </g>
  // We want only the teeth (rects/<g rotated rects>), no text.
  function extractTeeth(panelMatch) {
    if (!panelMatch) return "";
    const inner = panelMatch[1];
    // Drop SUP/INF labels and any other <text>
    return inner.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, "");
  }

  // Anchor end on the next comment marker so the greedy `</g>\s*</g>` capture
  // closes at the panel boundary (not at the first inner tooth's closing tag).
  const antesMatch = svg.match(
    /<!--\s*Panel ANTES\s*-->[\s\S]*?<g transform="translate\(0, 30\) scale\(0\.95\)">([\s\S]*?)<\/g>\s*<\/g>\s*<!--/
  );
  const despuesMatch = svg.match(
    /<!--\s*Panel DESPUÉS\s*-->[\s\S]*?<g transform="translate\(0, 30\) scale\(0\.95\)">([\s\S]*?)<\/g>\s*<\/g>\s*<!--/
  );

  const antesTeeth = extractTeeth(antesMatch);
  const despuesTeeth = extractTeeth(despuesMatch);

  // Build a clean SVG with proper clipPath. Each panel: 380x260, padded inside.
  // Stack vertically (antes top, después below) so when rendered full-width
  // the schematic is tall enough to be legible — instead of getting squashed.
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 580" width="400" height="580" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">
  <defs>
    <clipPath id="panel-antes">
      <rect x="0" y="0" width="380" height="260" rx="12"/>
    </clipPath>
    <clipPath id="panel-despues">
      <rect x="0" y="0" width="380" height="260" rx="12"/>
    </clipPath>
  </defs>

  <!-- Panel ANTES -->
  <g transform="translate(10, 10)">
    <rect width="380" height="260" rx="12" fill="#FBF8F3" stroke="#B8965A" stroke-width="0.6" stroke-opacity="0.4"/>
    <text x="20" y="28" font-family="Inter, sans-serif" font-size="11" letter-spacing="0.25em" font-weight="600" fill="#1A2238">ANTES</text>
    <line x1="20" y1="38" x2="60" y2="38" stroke="#B8965A" stroke-width="1" stroke-opacity="0.5"/>
    <g clip-path="url(#panel-antes)">
      <g transform="translate(15, 50) scale(0.95)">
${antesTeeth.trimEnd()}
      </g>
    </g>
  </g>

  <!-- Panel DESPUÉS -->
  <g transform="translate(10, 300)">
    <rect width="380" height="260" rx="12" fill="#FBF8F3" stroke="#B8965A" stroke-width="0.6" stroke-opacity="0.4"/>
    <text x="20" y="28" font-family="Inter, sans-serif" font-size="11" letter-spacing="0.25em" font-weight="600" fill="#8E6F3E">DESPUÉS</text>
    <line x1="20" y1="38" x2="80" y2="38" stroke="#B8965A" stroke-width="1.4"/>
    <g clip-path="url(#panel-despues)">
      <g transform="translate(15, 50) scale(0.95)">
${despuesTeeth.trimEnd()}
      </g>
    </g>
  </g>
</svg>
`;

  writeFileSync(path, out, "utf8");
  console.log(`✓ Rebuilt ${file}`);
}
