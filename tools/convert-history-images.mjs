import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.resolve(repoRoot, "..", "20260714_よこぼのAIラボ歴史資料館", "assets");
const outputDir = path.join(repoRoot, "public", "history");

await mkdir(outputDir, { recursive: true });
const files = (await readdir(sourceDir)).filter((name) => name.toLowerCase().endsWith(".png")).sort();

if (files.length === 0) {
  throw new Error(`PNG files not found: ${sourceDir}`);
}

let totalBytes = 0;
for (const file of files) {
  const source = path.join(sourceDir, file);
  const output = path.join(outputDir, `${path.parse(file).name}.webp`);
  const info = await sharp(source)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output);
  const outputSize = (await stat(output)).size;

  totalBytes += outputSize;
  console.log(`${path.basename(output)}: ${info.width}x${info.height}, ${(outputSize / 1024).toFixed(1)} KiB`);
}

console.log(`Total: ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`);
