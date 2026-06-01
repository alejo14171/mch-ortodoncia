// One-shot: replace " — " with ", " across user-facing content files.
// Skips SVG assets, internal lib code, and CSS comments where em-dashes
// don't render to the user. After running, the dev server hot-reloads.
//
// Run with:  node scripts/strip-em-dashes.mjs
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname.replace(/^\//, "");

const INCLUDE_DIRS = ["content", "components", "pages", "layouts"];
const EXCLUDE_PATTERNS = [
  /[\\/]assets[\\/]/,
  /[\\/]styles[\\/]/,
  /[\\/]lib[\\/]/,
  /env\.d\.ts$/,
];
const INCLUDE_EXT = /\.(md|ts|astro)$/i;

const FROM = " — ";
const TO = ", ";

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const all = [];
for (const d of INCLUDE_DIRS) {
  all.push(...(await walk(join(ROOT, d))));
}
const files = all.filter(
  (p) => INCLUDE_EXT.test(p) && !EXCLUDE_PATTERNS.some((re) => re.test(p))
);

let totalEdits = 0;
let totalFiles = 0;
for (const path of files) {
  const original = await readFile(path, "utf8");
  if (!original.includes(FROM)) continue;
  const count = original.split(FROM).length - 1;
  const updated = original.split(FROM).join(TO);
  await writeFile(path, updated, "utf8");
  totalFiles++;
  totalEdits += count;
  console.log(`✓ ${path.padEnd(60)} -${count}`);
}

console.log(`\nDone. ${totalEdits} replacements in ${totalFiles} files.`);
