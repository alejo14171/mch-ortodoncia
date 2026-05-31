// Privacy-preserving anonymization + framing normalization for clinical photos.
// Workflow per face photo:
//   1. Read the un-anonymized original from /_assets/assets_joel/{antes|despues}/...
//   2. CROP to a tight portrait framing so face fills the frame consistently
//      across antes/después (the two shoots used different distances).
//   3. BLUR the eye band heavily (sigma 55, idempotent on re-runs).
//   4. Write JPEG quality 92 into src/assets/casos-destacados/joel/...
//
// Intraoral photos (mordida/arcadas/laterales) need no blur and no recrop
// — they're copied straight through.
//
// IMPORTANT: this script ALWAYS reads from the un-anonymized originals so
// you can adjust crop/blur parameters and re-run cleanly. The originals
// live OUTSIDE the project tree (in /_assets/) and are never committed.
//
// Run:  node scripts/anonymize-case.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..");
const srcRoot = join(projectRoot, "_assets", "assets_joel");
const outRoot = join(here, "..", "src", "assets", "casos-destacados", "joel");

// Map clean keys → original filenames (original names are messy).
const NAMES = {
  antes: {
    frente: "JOEL SANTIAGO MOYA BAQUERO TI.1014871454 FRENTE.jpg",
    sonrisa: "JOEL SANTIAGO MOYA BAQUERO TI1014871454 SONRISA..jpg",
    perfil: "JOEL SANTIAGO MOYA BAQUERO TI.10104871454 PERFIL.jpg",
    mordida: "JOEL SANTIAGO MOYA BAQUERO TI 1014871454 MORDIDA.jpg",
    "lateral-derecho": "JOEL SANTIAGO  MOYA BAQUERO TI.1014871454 LATERAL DERCHO.jpg",
    "lateral-izquierdo": "JOEL SANTIAGO MOYA BAQUERO LATERAL IZ TI.1014871454.jpg",
    "arcada-superior": "JOEL SANTIAGO MOYA BAQUERO MOLDE SUP  TI.jpg",
    "arcada-inferior": "JOEL SANTIAGO MOYA BAQUERO ARCADA INF TI.1014871454.jpg",
  },
  despues: {
    frente: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO DE FRENTE .jpg",
    sonrisa: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO SONRIENDO .jpg",
    perfil: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO PERFIL .jpg",
    mordida: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO MORDIDA.jpg",
    "lateral-derecho": "JOEL SANTIAGO MOYA -TI 1014871454- FOTO LATERAL DERECHO .jpg",
    "lateral-izquierdo": "JOEL SANTIAGO MOYA - TI 1014871454- FOTO LATERAL IZQUIERDO .jpg",
    "arcada-superior": "JOEL SANTIAGO MOYA- TI 1014871454- FOTO ARCADA SUPERIOR.jpg",
    "arcada-inferior": "JOEL SANTIAGO MOTA- TI 1014871454- FOTO ARCADA INFERIOR .jpg",
  },
};

// Crop box per (phase, key) as fractions of original w/h.
// Goal: face fills similar proportion in antes vs después.
// Antes shoot framed face higher in frame → zoom in by trimming top hair + bottom shoulders.
// Despues framing already tight enough — minimal trim.
const CROPS = {
  antes: {
    frente: { x: 0.05, y: 0.07, w: 0.90, h: 0.78 },
    sonrisa: { x: 0.05, y: 0.07, w: 0.90, h: 0.78 },
    perfil: { x: 0.05, y: 0.10, w: 0.90, h: 0.78 },
  },
  despues: {
    frente: { x: 0.05, y: 0.10, w: 0.90, h: 0.80 },
    sonrisa: { x: 0.05, y: 0.10, w: 0.90, h: 0.80 },
    perfil: { x: 0.05, y: 0.10, w: 0.90, h: 0.80 },
  },
};

// Eye region as fractions of the CROPPED image (not the original).
const EYE_BANDS = {
  // After cropping antes, eyes land ~y=38-50% of the cropped frame.
  antes: {
    frente: { x: 0.06, y: 0.30, w: 0.88, h: 0.18 },
    sonrisa: { x: 0.06, y: 0.30, w: 0.88, h: 0.18 },
    perfil: { x: 0.42, y: 0.32, w: 0.55, h: 0.16 },
  },
  // Despues already framed tightly → eyes ~y=38-52% of the cropped frame.
  despues: {
    frente: { x: 0.05, y: 0.36, w: 0.90, h: 0.18 },
    sonrisa: { x: 0.05, y: 0.36, w: 0.90, h: 0.18 },
    perfil: { x: 0.35, y: 0.36, w: 0.60, h: 0.18 },
  },
};

// Sigma scales with the band height so the blur is equally effective on
// the 702-px-tall 'antes' shots and the 2551-px-tall 'despues' shots.
// Two blur passes give a wider, smoother kernel than a single pass at the
// same sigma — eyes become a soft skin-toned smear instead of a recognizable
// shape. Minimum sigma 25 so the small antes images still get strong blur.
function blurSigmaFor(bandHeightPx) {
  return Math.max(25, Math.round(bandHeightPx / 5));
}

async function process(phase, key, originalFile, outFile) {
  const buf = readFileSync(originalFile);
  let pipeline = sharp(buf);
  let meta = await pipeline.metadata();
  if (!meta.width || !meta.height) {
    console.warn(`⚠ skipped ${outFile} — no dimensions`);
    return;
  }

  // ── 1. CROP if configured (face photos only) ────────────────────────────
  const crop = CROPS[phase]?.[key];
  if (crop) {
    const region = {
      left: Math.round(meta.width * crop.x),
      top: Math.round(meta.height * crop.y),
      width: Math.round(meta.width * crop.w),
      height: Math.round(meta.height * crop.h),
    };
    pipeline = pipeline.extract(region);
    meta = { width: region.width, height: region.height };
  }

  // ── 2. EYE BLUR if configured (face photos only) ────────────────────────
  const band = EYE_BANDS[phase]?.[key];
  if (band) {
    const region = {
      left: Math.round(meta.width * band.x),
      top: Math.round(meta.height * band.y),
      width: Math.round(meta.width * band.w),
      height: Math.round(meta.height * band.h),
    };
    // Materialize the cropped buffer first, then composite blurred band.
    // Apply two blur passes so the eye region becomes a smooth skin-toned
    // smear rather than a recognizable but fuzzy eye shape.
    const sigma = blurSigmaFor(region.height);
    const cropped = await pipeline.jpeg().toBuffer();
    const pass1 = await sharp(cropped).extract(region).blur(sigma).toBuffer();
    const blurred = await sharp(pass1).blur(Math.round(sigma / 2)).toBuffer();
    pipeline = sharp(cropped).composite([
      { input: blurred, left: region.left, top: region.top },
    ]);
    meta = { width: meta.width, height: meta.height };
    console.log(`   blur sigma=${sigma}+${Math.round(sigma/2)} on ${region.width}×${region.height}`);
  }

  const out = await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  writeFileSync(outFile, out);
  const note = crop && band ? "crop+blur" : crop ? "crop" : band ? "blur" : "passthrough";
  console.log(`✓ ${phase}/${key.padEnd(18)} ${meta.width}×${meta.height}  [${note}]`);
}

for (const phase of ["antes", "despues"]) {
  const outDir = join(outRoot, phase);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  for (const [key, filename] of Object.entries(NAMES[phase])) {
    const src = join(srcRoot, phase, filename);
    if (!existsSync(src)) {
      console.warn(`⚠ missing source: ${src}`);
      continue;
    }
    const out = join(outDir, `${key}.jpg`);
    await process(phase, key, src, out);
  }
}

console.log("\nDone. Re-run the Astro build to regenerate responsive WebP outputs.");
