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
// Bands intentionally OVER-cover: better a slightly bigger blur than
// pupils leaking out the bottom of the bar.
const EYE_BANDS = {
  // After cropping antes, eyes land ~y=42-50% of the cropped frame.
  antes: {
    frente: { x: 0.04, y: 0.32, w: 0.92, h: 0.24 },
    sonrisa: { x: 0.04, y: 0.32, w: 0.92, h: 0.22 },
    // Profile: eye is lower than I had it — push band down ~10%.
    perfil: { x: 0.40, y: 0.42, w: 0.58, h: 0.20 },
  },
  // Despues framed tighter and high-res — band extends well past eyes
  // to allow heavy blur without pupils peeking out at the seam.
  despues: {
    frente: { x: 0.03, y: 0.34, w: 0.94, h: 0.22 },
    sonrisa: { x: 0.03, y: 0.34, w: 0.94, h: 0.22 },
    perfil: { x: 0.33, y: 0.34, w: 0.64, h: 0.22 },
  },
};

// Sigma scales with the band height so the blur is equally effective on
// the 702-px-tall 'antes' shots and the 2551-px-tall 'despues' shots.
// Three blur passes turn the eye region into a uniform skin-toned smear
// with no recognizable pupil/iris contours, even on the high-res photos.
// Minimum sigma 30 so even the tiny antes bands get a solid blur.
function blurSigmaFor(bandHeightPx) {
  return Math.max(30, Math.round(bandHeightPx / 4));
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
    // Materialize the cropped buffer, then extract the eye band and
    // hit it with THREE blur passes (full sigma → half → quarter).
    // The compounding effect collapses iris/pupil contrast to near
    // uniform skin tone while still letting the brow line breathe.
    const sigma = blurSigmaFor(region.height);
    const cropped = await pipeline.jpeg().toBuffer();
    const pass1 = await sharp(cropped).extract(region).blur(sigma).toBuffer();
    const pass2 = await sharp(pass1).blur(Math.round(sigma / 2)).toBuffer();
    const blurred = await sharp(pass2).blur(Math.round(sigma / 4)).toBuffer();
    pipeline = sharp(cropped).composite([
      { input: blurred, left: region.left, top: region.top },
    ]);
    meta = { width: meta.width, height: meta.height };
    console.log(`   blur 3×: σ=${sigma}+${Math.round(sigma/2)}+${Math.round(sigma/4)} on ${region.width}×${region.height}`);
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
