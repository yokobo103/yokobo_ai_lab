import { promises as fs } from "fs";
import path from "path";
import { isGitHubStorageEnabled, readTextFromGitHub, writeTextToGitHub } from "./github-storage";

// 宣伝室で作った組み合わせ（ネタ・画像・文章）の保存。
// スマホとPCのどちらから開いても同じものが出るよう、端末ではなくサーバー側に置く。

export type PromoPreset = {
  id: string;
  name: string;
  topic: string;
  postId: string;
  images: string[];
  text: string;
  savedAt: string;
};

const dataPath = path.join(process.cwd(), "data", "promo-presets.json");
const MAX_PRESETS = 30;

export function sortPresets(presets: PromoPreset[]) {
  return [...presets].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function normalizePreset(input: unknown): PromoPreset | { message: string } {
  if (!input || typeof input !== "object") return { message: "保存する内容がありません。" };
  const value = input as Record<string, unknown>;

  const name = typeof value.name === "string" ? value.name.trim().slice(0, 40) : "";
  if (!name) return { message: "プリセットの名前を入れてください。" };

  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!text) return { message: "文章が空です。" };

  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === "string" && item.startsWith("/")).slice(0, 4)
    : [];

  return {
    id: typeof value.id === "string" && value.id ? value.id : `preset-${Date.now()}`,
    name,
    topic: typeof value.topic === "string" ? value.topic : "site",
    postId: typeof value.postId === "string" ? value.postId : "",
    images,
    text,
    savedAt: new Date().toISOString(),
  };
}

export async function readPresets(): Promise<PromoPreset[]> {
  try {
    if (isGitHubStorageEnabled()) {
      const raw = await readTextFromGitHub("data/promo-presets.json");
      return sortPresets(JSON.parse(raw || "[]") as PromoPreset[]);
    }

    const raw = await fs.readFile(dataPath, "utf8");
    return sortPresets(JSON.parse(raw) as PromoPreset[]);
  } catch {
    // まだ1件も保存していないときはファイルがない。
    return [];
  }
}

export async function writePresets(presets: PromoPreset[]) {
  const trimmed = sortPresets(presets).slice(0, MAX_PRESETS);
  const content = `${JSON.stringify(trimmed, null, 2)}\n`;

  if (isGitHubStorageEnabled()) {
    await writeTextToGitHub("data/promo-presets.json", content, "宣伝室のプリセットを更新");
    return;
  }

  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, content, "utf8");
}
