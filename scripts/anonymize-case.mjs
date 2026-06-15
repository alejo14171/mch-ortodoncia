// Privacy-preserving anonymization + framing normalization for clinical photos.
// Workflow per face photo:
//   1. Read the un-anonymized original from /_assets/assets_joel/{antes|despues}/...
//      (folder name kept on the local disk; never committed)
//   2. CROP to a tight portrait framing so face fills the frame consistently
//      across antes/después (the two shoots used different distances).
//   3. BLUR the eye band heavily (sigma 55, idempotent on re-runs).
//   4. Write JPEG quality 92 into src/assets/casos-destacados/paciente-i/...
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
const outRoot = join(here, "..", "src", "assets", "casos-destacados", "paciente-i");

// Map clean keys → original filenames (original names are messy).
const NAMES = {
  antes: {
    frente: "JOEL SANTIAGO MOYA BAQUERO TI.1014871454 FRENTE.jpg",
    sonrisa: "JOEL SANTIAGO MOYA BAQUERO TI1014871454 SONRISA..jpg",
    perfil: "JOEL SANTIAGO MOYA BAQUERO TI.10104871454 PERFIL.jpg",
    mordida: "JOEL SANTIAGO MOYA BAQUERO TI 1014871454 MORDIDA.jpg",
    "lateral-derecho": "JOEL SANTIAGO  MOYA BAQUERO TI.1014871454 LATERAL DERCHO.jpg",
    "lateral-izquierdo": "JOEL SANTIAGO MOYA BAQUERO LATERAL IZ TI.1014871454.jpg",
    // arcadas eliminadas — no rinden bien y no aportan al storytelling
  },
  despues: {
    frente: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO DE FRENTE .jpg",
    sonrisa: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO SONRIENDO .jpg",
    perfil: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO PERFIL .jpg",
    mordida: "JOEL SANTIAGO MOYA- TI 1014871454- FOTO MORDIDA.jpg",
    "lateral-derecho": "JOEL SANTIAGO MOYA -TI 1014871454- FOTO LATERAL DERECHO .jpg",
    "lateral-izquierdo": "JOEL SANTIAGO MOYA - TI 1014871454- FOTO LATERAL IZQUIERDO .jpg",
  },
};

// Crop box per (phase, key) as fractions of original w/h.
// Goal: face fills the frame consistently across antes/después so
// pairs feel like the same shot at two moments in time.
//
// Measurements from reading the raw originals:
//   antes/sonrisa: eyebrows ~0.27, eyes ~0.33, chin ~0.70
//   antes/frente:  eyebrows ~0.30, eyes ~0.42, chin ~0.85 (face sits LOWER in frame)
//   después/sonrisa+frente: eyebrows ~0.34, eyes ~0.42, chin ~0.88
const CROPS = {
  antes: {
    // Frente: kid is more reclined, face sits lower — need taller crop.
    frente:  { x: 0.05, y: 0.08, w: 0.90, h: 0.82 },
    // Sonrisa: leaning forward, face tighter — short crop just past chin.
    sonrisa: { x: 0.05, y: 0.05, w: 0.90, h: 0.72 },
    perfil:  { x: 0.05, y: 0.05, w: 0.90, h: 0.78 },
  },
  despues: {
    // Looser at the bottom — keeps full chin instead of trimming it.
    frente:  { x: 0.05, y: 0.05, w: 0.90, h: 0.92 },
    sonrisa: { x: 0.05, y: 0.05, w: 0.90, h: 0.92 },
    perfil:  { x: 0.05, y: 0.05, w: 0.90, h: 0.92 },
  },
};

// Eye region as fractions of the CROPPED image (not the original).
// Band sized to fully cover eyes WITH 5-7 pp of buffer above (to keep eyebrows
// exposed) and below (to keep nostrils clear). Per-photo tuning because the
// vertical eye position in each cropped frame varies by 5-10 pp.
const EYE_BANDS = {
  antes: {
    // Eyes ~0.43 in cropped frame → band 0.36-0.56 covers with margin.
    frente:  { x: 0.04, y: 0.36, w: 0.92, h: 0.20 },
    // Eyes ~0.38 in cropped frame → band 0.32-0.50.
    sonrisa: { x: 0.04, y: 0.32, w: 0.92, h: 0.18 },
    // Profile: only the camera-side eye is visible.
    perfil:  { x: 0.40, y: 0.42, w: 0.58, h: 0.18 },
  },
  despues: {
    // Eyes ~0.40 in cropped frame → band 0.34-0.52.
    frente:  { x: 0.04, y: 0.34, w: 0.92, h: 0.18 },
    sonrisa: { x: 0.04, y: 0.34, w: 0.92, h: 0.18 },
    perfil:  { x: 0.33, y: 0.36, w: 0.64, h: 0.18 },
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
