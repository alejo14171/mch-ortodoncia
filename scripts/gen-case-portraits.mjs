// Generate 6 stylized SVG portrait placeholders for cases.
// Each conveys a different age/persona via color palette and silhouette.
// Replace these with real AI-generated photos later — keep filenames identical.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "src", "assets", "casos-fotos");
mkdirSync(outDir, { recursive: true });

// 6 personas, each with bg gradient + silhouette tone + accent
const personas = [
  { id: 1, label: "Adulta · 32 años", bgA: "#E8D5C8", bgB: "#B8746B", skin: "#E8C4A6", hair: "#3B2718", gender: "f", age: "adult" },
  { id: 2, label: "Adolescente · 15 años", bgA: "#D4E0E8", bgB: "#7892A8", skin: "#E8C4A6", hair: "#5B3F2A", gender: "m", age: "teen" },
  { id: 3, label: "Niño · 9 años", bgA: "#FBF8F3", bgB: "#D9C197", skin: "#F0D8B8", hair: "#3B2718", gender: "m", age: "kid" },
  { id: 4, label: "Adulto · 28 años", bgA: "#E5DDD0", bgB: "#8E6F3E", skin: "#D8B594", hair: "#1A1208", gender: "m", age: "adult" },
  { id: 5, label: "Adulta · 41 años", bgA: "#F0E2D5", bgB: "#B8965A", skin: "#E8C4A6", hair: "#2A1810", gender: "f", age: "mature" },
  { id: 6, label: "Adulto · 38 años", bgA: "#DDE2E8", bgB: "#4A5170", skin: "#D8B594", hair: "#1A1208", gender: "m", age: "adult" },
];

function makeSvg(p) {
  // Subtle silhouette by gender — kept abstract, no facial features (so it reads as "placeholder")
  const headW = p.age === "kid" ? 86 : 100;
  const headH = p.age === "kid" ? 110 : 130;
  const shoulderTop = 250;
  const headTopY = 100;
  const longHair = p.gender === "f";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Retrato esquemático de paciente — ${p.label}">
  <defs>
    <linearGradient id="bg${p.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bgA}"/>
      <stop offset="100%" stop-color="${p.bgB}" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="light${p.id}" cx="0.7" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="480" fill="url(#bg${p.id})"/>
  <rect width="400" height="480" fill="url(#light${p.id})"/>

  <!-- Shoulders / torso -->
  <path d="M 60 480 L 60 ${shoulderTop + 70} Q 60 ${shoulderTop} 130 ${shoulderTop - 20} L 270 ${shoulderTop - 20} Q 340 ${shoulderTop} 340 ${shoulderTop + 70} L 340 480 Z" fill="#FBF8F3" opacity="0.92"/>

  <!-- Hair back (longer for feminine, shorter masculine) -->
  ${
    longHair
      ? `<path d="M ${200 - headW / 2 - 20} ${headTopY + 30} Q ${200 - headW / 2 - 30} ${headTopY + 100} ${200 - headW / 2 - 10} ${shoulderTop - 10} L ${200 + headW / 2 + 10} ${shoulderTop - 10} Q ${200 + headW / 2 + 30} ${headTopY + 100} ${200 + headW / 2 + 20} ${headTopY + 30} Q ${200 + headW / 2 - 5} ${headTopY - 10} 200 ${headTopY - 20} Q ${200 - headW / 2 + 5} ${headTopY - 10} ${200 - headW / 2 - 20} ${headTopY + 30} Z" fill="${p.hair}"/>`
      : `<path d="M ${200 - headW / 2 - 5} ${headTopY + 25} Q ${200 - headW / 2} ${headTopY - 5} 200 ${headTopY - 15} Q ${200 + headW / 2} ${headTopY - 5} ${200 + headW / 2 + 5} ${headTopY + 25} Q ${200 + headW / 2 - 8} ${headTopY + 10} 200 ${headTopY + 5} Q ${200 - headW / 2 + 8} ${headTopY + 10} ${200 - headW / 2 - 5} ${headTopY + 25} Z" fill="${p.hair}"/>`
  }

  <!-- Neck -->
  <rect x="${200 - 22}" y="${headTopY + headH - 10}" width="44" height="60" rx="22" fill="${p.skin}"/>

  <!-- Face oval (no features — abstract placeholder) -->
  <ellipse cx="200" cy="${headTopY + headH / 2}" rx="${headW / 2}" ry="${headH / 2}" fill="${p.skin}"/>

  <!-- Soft cheek shading -->
  <ellipse cx="${200 + 15}" cy="${headTopY + headH / 2 + 10}" rx="${headW / 3}" ry="${headH / 2 - 10}" fill="${p.bgB}" opacity="0.12"/>

  <!-- Subtle hair fringe on top -->
  ${longHair
    ? `<path d="M ${200 - headW / 2 + 5} ${headTopY + 5} Q 200 ${headTopY - 12} ${200 + headW / 2 - 5} ${headTopY + 5} Q 200 ${headTopY + 30} 200 ${headTopY + 25} Q ${200 - 15} ${headTopY + 30} ${200 - headW / 2 + 5} ${headTopY + 5} Z" fill="${p.hair}" opacity="0.85"/>`
    : ""}

  <!-- Subtle gold particles -->
  <circle cx="60" cy="80" r="1.5" fill="#B8965A" opacity="0.5"/>
  <circle cx="340" cy="60" r="1.5" fill="#B8965A" opacity="0.4"/>
  <circle cx="320" cy="180" r="1" fill="#B8965A" opacity="0.3"/>
</svg>
`;
}

for (const p of personas) {
  const file = `caso-${String(p.id).padStart(2, "0")}-paciente.svg`;
  writeFileSync(join(outDir, file), makeSvg(p), "utf8");
  console.log(`✓ Generated ${file}`);
}
