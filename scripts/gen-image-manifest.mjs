// 宣伝室（/admin/promo）が使う画像候補の一覧を作る。
// Vercelの実行時にpublic/を走査するのは不確実なので、ビルド前にJSONへ書き出しておく。
// 記事に紐づく画像はdata/posts.jsonから取れるので、ここではサイト共通の素材だけを対象にする。
//
// どれを宣伝に使うかは data/promo-curation.json で決める。実物を見て選んだ結果を持つファイルで、
// フォルダ名から機械的に判定していた頃は開発中のスクショや日付入りの古い素材が混ざっていた。

import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(projectRoot, "public");
const outputFile = path.join(publicDir, "promo-images.json");
const curationFile = path.join(projectRoot, "data", "promo-curation.json");

// uploadsは記事データ側から辿れる。design-referenceは公開対象外。
const skipDirs = new Set(["uploads", "design-reference"]);
// バッジやアイコンは宣伝画像には向かないので、小さすぎるものは落とす。
const minWidth = 480;

async function collectWebp(dir, relative = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (relative === "" && skipDirs.has(entry.name)) continue;
      found.push(...(await collectWebp(path.join(dir, entry.name), rel)));
    } else if (entry.name.toLowerCase().endsWith(".webp")) {
      found.push(rel);
    }
  }

  return found;
}

async function describe(relativePath) {
  const absolute = path.join(publicDir, relativePath);
  try {
    const [meta, info] = await Promise.all([sharp(absolute).metadata(), stat(absolute)]);
    if (!meta.width || !meta.height) return null;
    if (meta.width < minWidth) return null;

    const segments = relativePath.split("/");
    return {
      path: `/${relativePath}`,
      group: segments.length > 1 ? segments[0] : "root",
      subgroup: segments.length > 2 ? segments[1] : "",
      width: meta.width,
      height: meta.height,
      bytes: info.size,
    };
  } catch {
    // 壊れた画像1枚でビルドを止めない。
    return null;
  }
}

const curation = JSON.parse(await readFile(curationFile, "utf8"));
const pickedTags = new Map(curation.picks.map((pick) => [pick.path, pick.tag]));
const rejected = new Set(
  Object.entries(curation.rejected)
    .filter(([key]) => !key.startsWith("_"))
    .flatMap(([, paths]) => paths)
);

const files = await collectWebp(publicDir);
const described = await Promise.all(files.map(describe));
const images = described
  .filter(Boolean)
  .map((image) => ({ ...image, tag: pickedTags.get(image.path) || "" }))
  .sort((a, b) => a.path.localeCompare(b.path));

await mkdir(publicDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify({ images }, null, 2)}\n`, "utf8");

const picked = images.filter((image) => image.tag);
const unreviewed = images.filter((image) => !image.tag && !rejected.has(image.path));
console.log(`promo-images.json: ${images.length}枚を登録、うち宣伝に使えるのは${picked.length}枚`);
if (unreviewed.length > 0) {
  // 新しい画像が増えても黙って候補に混ざらない。見てから data/promo-curation.json に足す。
  console.log(`未選別が${unreviewed.length}枚あります（宣伝室には出ません）:`);
  for (const image of unreviewed.slice(0, 20)) console.log(`  - ${image.path}`);
  if (unreviewed.length > 20) console.log(`  …ほか${unreviewed.length - 20}枚`);
}
