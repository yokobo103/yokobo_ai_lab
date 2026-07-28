import { promises as fs } from "fs";
import path from "path";
import { isGitHubStorageEnabled, readTextFromGitHub, writeTextToGitHub } from "./github-storage";

// 宣伝室で何をいつ出したかの記録。
// 文章の型を分けても、記録がないと効いたのかどうか誰にも言えないので残す。
// 数字（インプレッション）はX APIを使わない方針上とれないので、ここには入れない。

export type PromoShare = {
  kind: "share";
  id: string;
  at: string;
  topic: string;
  title: string;
  textType: string;
  media: "video" | "images" | "none";
  imageCount: number;
  linkInReply: boolean;
  hashtags: boolean;
};

// その日の運用の自己申告（リプライ何件したか等）。日付ごとに1件だけ持つ。
export type PromoDay = {
  kind: "day";
  id: string;
  date: string;
  replies: number;
  updatedAt: string;
};

export type PromoLogEntry = PromoShare | PromoDay;

const dataPath = path.join(process.cwd(), "data", "promo-log.json");
const MAX_ENTRIES = 200;

function sortEntries(entries: PromoLogEntry[]) {
  return [...entries].sort((a, b) => entryTime(b).localeCompare(entryTime(a)));
}

function entryTime(entry: PromoLogEntry) {
  return entry.kind === "share" ? entry.at : entry.updatedAt;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normalizeEntry(input: unknown): PromoLogEntry | { message: string } {
  if (!input || typeof input !== "object") return { message: "記録する内容がありません。" };
  const value = input as Record<string, unknown>;
  const now = new Date().toISOString();

  if (value.kind === "day") {
    const date = text(value.date, 10) || now.slice(0, 10);
    const replies = Number(value.replies);
    if (!Number.isFinite(replies) || replies < 0 || replies > 500) {
      return { message: "リプライの件数が正しくありません。" };
    }
    return { kind: "day", id: `day-${date}`, date, replies: Math.round(replies), updatedAt: now };
  }

  const media = value.media === "video" || value.media === "images" ? value.media : "none";
  const imageCount = Number(value.imageCount);

  return {
    kind: "share",
    id: text(value.id, 40) || `share-${Date.now()}`,
    at: now,
    topic: text(value.topic, 20) || "site",
    title: text(value.title, 80),
    textType: text(value.textType, 10) || "自作",
    media,
    imageCount: Number.isFinite(imageCount) ? Math.max(0, Math.min(4, Math.round(imageCount))) : 0,
    linkInReply: value.linkInReply !== false,
    hashtags: value.hashtags === true,
  };
}

function isMissingFile(error: unknown) {
  if (error instanceof Error && error.message.includes("GitHub API error 404")) return true;
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "ENOENT";
}

export async function readLog(): Promise<PromoLogEntry[]> {
  try {
    if (isGitHubStorageEnabled()) {
      const raw = await readTextFromGitHub("data/promo-log.json");
      return sortEntries(JSON.parse(raw || "[]") as PromoLogEntry[]);
    }

    const raw = await fs.readFile(dataPath, "utf8");
    return sortEntries(JSON.parse(raw) as PromoLogEntry[]);
  } catch (error) {
    // まだ1件もないときはファイルがない。それ以外の失敗は握りつぶさない
    // （空扱いにすると次の書き込みで過去の記録を消してしまう。プリセットと同じ理由）。
    if (isMissingFile(error)) return [];
    throw error;
  }
}

export async function writeLog(entries: PromoLogEntry[]) {
  const trimmed = sortEntries(entries).slice(0, MAX_ENTRIES);
  const content = `${JSON.stringify(trimmed, null, 2)}\n`;

  if (isGitHubStorageEnabled()) {
    await writeTextToGitHub("data/promo-log.json", content, "宣伝室の記録を更新");
    return;
  }

  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, content, "utf8");
}

// 同じ日の自己申告は1件にまとめる。共有の記録はそのまま足していく。
export function mergeEntry(entries: PromoLogEntry[], entry: PromoLogEntry): PromoLogEntry[] {
  if (entry.kind === "day") {
    return [entry, ...entries.filter((item) => !(item.kind === "day" && item.date === entry.date))];
  }
  return [entry, ...entries.filter((item) => item.id !== entry.id)];
}
