import { promises as fs } from "fs";
import path from "path";
import { isGitHubStorageEnabled, readTextFromGitHub, writeTextToGitHub } from "./github-storage";

export type SiteUpdate = {
  id: string;
  date: string;
  title: string;
  href: string;
};

const dataPath = path.join(process.cwd(), "data", "site-updates.json");

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().replaceAll("-", ".");
  return /^\d{4}\.\d{2}\.\d{2}$/.test(trimmed) ? trimmed : "";
}

function normalizeHref(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

function makeSiteUpdateId(date: string, title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${date.replaceAll(".", "")}-${slug || Date.now()}`;
}

export function sortSiteUpdates(updates: SiteUpdate[]) {
  return [...updates].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export async function readSiteUpdates(): Promise<SiteUpdate[]> {
  if (isGitHubStorageEnabled()) {
    const raw = await readTextFromGitHub("data/site-updates.json");
    return sortSiteUpdates(JSON.parse(raw || "[]") as SiteUpdate[]);
  }

  const raw = await fs.readFile(dataPath, "utf8");
  return sortSiteUpdates(JSON.parse(raw) as SiteUpdate[]);
}

export async function writeSiteUpdates(updates: SiteUpdate[]) {
  const content = `${JSON.stringify(sortSiteUpdates(updates), null, 2)}\n`;

  if (isGitHubStorageEnabled()) {
    await writeTextToGitHub("data/site-updates.json", content, "Update site updates from admin");
    return;
  }

  await fs.writeFile(dataPath, content, "utf8");
}

export function normalizeSiteUpdate(input: Partial<SiteUpdate>, previous?: SiteUpdate): SiteUpdate | { message: string } {
  const date = normalizeDate(input.date ?? previous?.date);
  if (!date) return { message: "日付は YYYY-MM-DD または YYYY.MM.DD で入力してください。" };

  const title = typeof input.title === "string" ? input.title.trim() : previous?.title ?? "";
  if (!title) return { message: "更新タイトルを入力してください。" };

  const href = normalizeHref(input.href ?? previous?.href);
  if (!href) return { message: "リンク先は / から始まるパス、または http(s) URL を指定してください。" };

  return {
    id: input.id || previous?.id || makeSiteUpdateId(date, title),
    date,
    title,
    href,
  };
}
