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

  const antesMatch = svg.match(
    /<!--\s*Panel ANTES\s*-->[\s\S]*?<g transform="translate\(0, 30\) scale\(0\.95\)">([\s\S]*?)<\/g>\s*<\/g>/
  );
  const despuesMatch = svg.match(
    /<!--\s*Panel DESPUÉS\s*-->[\s\S]*?<g transform="translate\(0, 30\) scale\(0\.95\)">([\s\S]*?)<\/g>\s*<\/g>/
  );

  const antesTeeth = extractTeeth(antesMatch);
  const despuesTeeth = extractTeeth(despuesMatch);

  // Build a clean SVG with proper clipPath. Each panel: 360x220, padded inside.
  // Inner translate: keep teeth visible — use translate(8, 8) scale(0.85) to shrink and pad.
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">
  <defs>
    <clipPath id="panel-antes">
      <rect x="0" y="0" width="360" height="220" rx="10"/>
    </clipPath>
    <clipPath id="panel-despues">
      <rect x="0" y="0" width="360" height="220" rx="10"/>
    </clipPath>
  </defs>

  <!-- Panel ANTES -->
  <g transform="translate(20, 10)">
    <rect width="360" height="220" rx="10" fill="#FBF8F3" stroke="#B8965A" stroke-width="0.5" stroke-opacity="0.4"/>
    <g clip-path="url(#panel-antes)">
      <g transform="translate(8, 8) scale(0.85)">
${antesTeeth.trimEnd()}
      </g>
    </g>
  </g>

  <!-- Panel DESPUÉS -->
  <g transform="translate(420, 10)">
    <rect width="360" height="220" rx="10" fill="#FBF8F3" stroke="#B8965A" stroke-width="0.5" stroke-opacity="0.4"/>
    <g clip-path="url(#panel-despues)">
      <g transform="translate(8, 8) scale(0.85)">
${despuesTeeth.trimEnd()}
      </g>
    </g>
  </g>
</svg>
`;

  writeFileSync(path, out, "utf8");
  console.log(`✓ Rebuilt ${file}`);
}
