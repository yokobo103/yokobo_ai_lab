import { promises as fs } from "fs";
import path from "path";
import { defaultAuthorId, inferAuthorIdFromText, normalizeAuthorId, normalizeCoAuthor } from "./authors";
import { isGitHubStorageEnabled, readTextFromGitHub, writeTextToGitHub } from "./github-storage";
import { inferResultStatusId, normalizeResultStatusId } from "./result-statuses";
import { categories, researchLogCategories, type Category, type Post, type ResearchLogCategory } from "./schema";

export { categories, researchLogCategories, type Category, type Post, type ResearchLogCategory };

const dataPath = path.join(process.cwd(), "data", "posts.json");

const legacyCategoryMap: Record<string, Category> = {
  "画像生成": "画像・動画あそび",
  "ゲーム制作": "ゲームあそび",
  "3D": "3D・空間あそび",
  "AIツール": "AIしくみあそび",
  "失敗ログ": "気づき・ログ",
  "気づき": "気づき・ログ",
  "メモ": "気づき・ログ"
};

function normalizeCategory(value: unknown): Category | null {
  if (categories.includes(value as Category)) return value as Category;
  if (typeof value === "string") return legacyCategoryMap[value] ?? null;
  return null;
}

function normalizeCategories(input: Partial<Post>, previous?: Post): Category[] {
  const rawCategories = Array.isArray(input.categories) ? input.categories : [];
  const next = rawCategories
    .map((category) => normalizeCategory(category))
    .filter((category): category is Category => Boolean(category));

  const singleCategory = normalizeCategory(input.category) ?? normalizeCategory(previous?.category);
  if (singleCategory) next.unshift(singleCategory);

  const previousCategories = Array.isArray(previous?.categories) ? previous.categories : [];
  previousCategories
    .map((category) => normalizeCategory(category))
    .filter((category): category is Category => Boolean(category))
    .forEach((category) => next.push(category));

  return [...new Set(next)].slice(0, 2);
}

function normalizeResearchLogCategory(value: unknown): ResearchLogCategory | null {
  return researchLogCategories.includes(value as ResearchLogCategory) ? (value as ResearchLogCategory) : null;
}

function extractExperimentResult(value?: string) {
  if (!value) return "";
  return value.slice(0, 420).match(/実験結果[：:]\s*([^\n\r]+)/)?.[1]?.trim() ?? "";
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, "[]", "utf8");
  }
}

export async function readPosts(): Promise<Post[]> {
  if (isGitHubStorageEnabled()) {
    const raw = await readTextFromGitHub("data/posts.json");
    const posts = (JSON.parse(raw || "[]") as Partial<Post>[]).map(hydratePost);
    return posts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  await ensureDataFile();
  const raw = await fs.readFile(dataPath, "utf8");
  const posts = (JSON.parse(raw) as Partial<Post>[]).map(hydratePost);
  return posts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function writePosts(posts: Post[]) {
  const sorted = [...posts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const content = `${JSON.stringify(sorted, null, 2)}\n`;

  if (isGitHubStorageEnabled()) {
    await writeTextToGitHub("data/posts.json", content, "Update posts from admin");
    return;
  }

  await ensureDataFile();
  await fs.writeFile(dataPath, content, "utf8");
}

export async function getPost(id: string) {
  const posts = await readPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export function publicSortTime(post: Post) {
  return Date.parse(post.publishedAt || post.createdAt || post.updatedAt || "");
}

export function getPostDateValue(post: Pick<Post, "publishedAt" | "createdAt" | "updatedAt">) {
  return post.publishedAt || post.createdAt || post.updatedAt || "";
}

export function formatPostDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function sortPublicPosts(posts: Post[]) {
  return [...posts].sort((a, b) => publicSortTime(b) - publicSortTime(a));
}

export function isAdminPassword(value: string | null) {
  const password = process.env.ADMIN_PASSWORD;
  if (password) return Boolean(value && value === password);
  return process.env.NODE_ENV !== "production" && value === "local-lab";
}

export function makeSlug(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `post-${Date.now()}`;
}

export function nextResearchLogNumber(posts: Post[]) {
  return Math.max(0, ...posts.map((post) => post.logNumber ?? 0)) + 1;
}

export function normalizePost(input: Partial<Post>, previous?: Post, nextLogNumber?: number): Post {
  const now = new Date().toISOString();
  const nextStatus = input.status === "public" ? "public" : "draft";
  const publishedAt =
    nextStatus === "public"
      ? previous?.publishedAt || input.publishedAt || (previous?.status === "public" ? previous.createdAt : now)
      : previous?.publishedAt || input.publishedAt;
  const postCategories = normalizeCategories(input, previous);
  const primaryCategory = postCategories[0] ?? "気づき・ログ";
  const body = input.body ?? previous?.body ?? "";
  const author = normalizeAuthorId(input.author) ?? normalizeAuthorId(previous?.author) ?? inferAuthorIdFromText(body) ?? defaultAuthorId;
  const coAuthor = input.coAuthor === null
    ? undefined
    : normalizeCoAuthor(normalizeAuthorId(input.coAuthor) ?? previous?.coAuthor, author);
  const experimentResult =
    input.experimentResult?.trim() ||
    previous?.experimentResult?.trim() ||
    extractExperimentResult(body) ||
    "実験結果メモは編集中です。";
  const resultStatus =
    normalizeResultStatusId(input.resultStatus) ??
    normalizeResultStatusId(previous?.resultStatus) ??
    inferResultStatusId(experimentResult);
  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((tag) => (typeof tag === "string" ? tag.trim().replace(/^#/, "") : ""))
        .filter(Boolean)
    : previous?.tags ?? [];

  return {
    id: input.id || previous?.id || makeSlug(input.title || ""),
    logNumber:
      previous?.logNumber ??
      input.logNumber ??
      (nextStatus === "public" ? nextLogNumber : undefined),
    title: input.title?.trim() || previous?.title || "",
    summary: input.summary?.trim() || "",
    author,
    ...(coAuthor ? { coAuthor } : {}),
    experimentResult,
    resultStatus,
    category: primaryCategory,
    categories: postCategories,
    status: nextStatus,
    pinned: Boolean(input.pinned ?? previous?.pinned),
    logCategory: normalizeResearchLogCategory(input.logCategory) ?? normalizeResearchLogCategory(previous?.logCategory) ?? "開発ログ",
    tags: [...new Set(tags)].slice(0, 12),
    thumbnail: input.thumbnail || "",
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    body,
    links: Array.isArray(input.links)
      ? input.links.filter((link) => link.label?.trim() && link.url?.trim())
      : [],
    createdAt: previous?.createdAt || input.createdAt || now,
    publishedAt,
    updatedAt: now
  };
}

function hydratePost(input: Partial<Post>): Post {
  const post = normalizePost(input);
  return {
    ...post,
    createdAt: input.createdAt || post.createdAt,
    publishedAt: input.publishedAt,
    updatedAt: input.updatedAt || post.updatedAt
  };
}

export function validatePost(post: Post) {
  if (!post.title && !post.thumbnail && post.images.length === 0) {
    return "タイトルまたは画像を入れてください。画像だけの投稿もOKです。";
  }
  return null;
}
