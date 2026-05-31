// Privacy-preserving anonymization for clinical photos.
// Applies an in-place blur over the eye region of frontal/profile photos
// so the patient cannot be identified from the published images. Intraoral
// photos (mordida, arcadas, laterales) need no blur — they don't show the
// face/eyes.
//
// IMPORTANT: this script OVERWRITES the file in src/assets/.../joel/.
// The un-anonymized originals live outside the project tree
// (/c/Users/alejo/website_mch/_assets/assets_joel/) and should never be
// committed. The script is idempotent — re-running it on an already
// blurred image just adds an imperceptible additional blur pass.
//
// Run:  node scripts/anonymize-case.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const caseDir = join(here, "..", "src", "assets", "casos-destacados", "joel");

// Eye region per (phase, photo type), expressed as fractions of width/height.
// Antes/después shoots were framed differently so coordinates differ.
// Numbers are generous to cover brows + small framing variations.
const EYE_BANDS = {
  antes: {
    frente: { x: 0.08, y: 0.30, w: 0.84, h: 0.15 },
    sonrisa: { x: 0.08, y: 0.30, w: 0.84, h: 0.15 },
    // Profile: eye is around y=42-48% in this framing.
    perfil: { x: 0.42, y: 0.38, w: 0.55, h: 0.14 },
  },
  despues: {
    // 'Después' set is framed lower — eyes around y=42-50%.
    frente: { x: 0.08, y: 0.39, w: 0.84, h: 0.15 },
    sonrisa: { x: 0.08, y: 0.39, w: 0.84, h: 0.15 },
    perfil: { x: 0.40, y: 0.40, w: 0.55, h: 0.14 },
  },
};

async function blurEyes(filePath, phase, key) {
  const band = EYE_BANDS[phase]?.[key];
  if (!band) return; // not a face photo or no band configured

  const buf = readFileSync(filePath);
  const meta = await sharp(buf).metadata();
  if (!meta.width || !meta.height) {
    console.warn(`⚠ skipped ${filePath} — no dimensions`);
    return;
  }
  const region = {
    left: Math.round(meta.width * band.x),
    top: Math.round(meta.height * band.y),
    width: Math.round(meta.width * band.w),
    height: Math.round(meta.height * band.h),
  };

  // Extract the eye band, blur it heavily, then composite back.
  // sigma 35 makes eyes unrecognizable while keeping the image pleasant.
  const blurred = await sharp(buf).extract(region).blur(35).toBuffer();
  const out = await sharp(buf)
    .composite([{ input: blurred, left: region.left, top: region.top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  writeFileSync(filePath, out);
  console.log(`✓ ${phase}/${key}  band ${region.width}×${region.height} at (${region.left},${region.top})`);
}

for (const phase of Object.keys(EYE_BANDS)) {
  for (const key of Object.keys(EYE_BANDS[phase])) {
    const file = join(caseDir, phase, `${key}.jpg`);
    await blurEyes(file, phase, key);
  }
}

console.log("\nDone. Re-run the Astro build to regenerate responsive WebP outputs.");
