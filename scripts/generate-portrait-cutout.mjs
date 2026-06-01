// Generates a transparent-background cutout of the doctor's portrait.
// Run once with: node scripts/generate-portrait-cutout.mjs
//
// Output: src/assets/doctora/portrait-cutout.png (PNG with alpha)
//
// Uses @imgly/background-removal-node — local ONNX-based model.
// First run downloads ~80 MB of model weights, subsequent runs are cached.

import { removeBackground } from "@imgly/background-removal-node";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const INPUT = path.join(ROOT, "src/assets/doctora/portrait.png");
const OUTPUT = path.join(ROOT, "src/assets/doctora/portrait-cutout.png");

async function main() {
  const stat = await fs.stat(INPUT).catch(() => null);
  if (!stat) {
    console.error(`✗ Input not found: ${INPUT}`);
    process.exit(1);
  }
  console.log(`→ Input: ${path.relative(ROOT, INPUT)} (${(stat.size / 1024).toFixed(1)} KB)`);

  const inputBuffer = await fs.readFile(INPUT);
  // The package accepts Buffer / Blob / URL. We pass a Blob.
  const blob = new Blob([inputBuffer], { type: "image/png" });

  console.log("→ Removing background (first run downloads ~80 MB of model)...");
  const start = Date.now();
  const resultBlob = await removeBackground(blob, {
    // medium is the default; quality is best
    model: "medium",
    output: {
      format: "image/png",
      quality: 1,
    },
    progress: (key, current, total) => {
      if (total > 0) {
        const pct = ((current / total) * 100).toFixed(0);
        process.stdout.write(`\r  ${key}: ${pct}%        `);
      }
    },
  });
  process.stdout.write("\n");

  const buffer = Buffer.from(await resultBlob.arrayBuffer());
  await fs.writeFile(OUTPUT, buffer);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✓ Output: ${path.relative(ROOT, OUTPUT)} (${(buffer.length / 1024).toFixed(1)} KB) in ${elapsed}s`);
}

main().catch((err) => {
  console.error("✗ Error:", err);
  process.exit(1);
});
