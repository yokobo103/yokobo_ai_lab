import { promises as fs } from "fs";
import path from "path";
import { categories, type Category, type Post } from "./schema";

export { categories, type Category, type Post };

const dataPath = path.join(process.cwd(), "data", "posts.json");

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, "[]", "utf8");
  }
}

export async function readPosts(): Promise<Post[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataPath, "utf8");
  const posts = JSON.parse(raw) as Post[];
  return posts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function writePosts(posts: Post[]) {
  await ensureDataFile();
  const sorted = [...posts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  await fs.writeFile(dataPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

export async function getPost(id: string) {
  const posts = await readPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export function isAdminPassword(value: string | null) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && value && value === password);
}

export function makeSlug(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `post-${Date.now()}`;
}

export function normalizePost(input: Partial<Post>, previous?: Post): Post {
  const now = new Date().toISOString();
  const category = categories.includes(input.category as Category)
    ? (input.category as Category)
    : previous?.category ?? "メモ";

  return {
    id: input.id || previous?.id || makeSlug(input.title || ""),
    title: input.title?.trim() || previous?.title || "",
    summary: input.summary?.trim() || "",
    category,
    status: input.status === "public" ? "public" : "draft",
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => tag.trim()).filter(Boolean) : [],
    thumbnail: input.thumbnail || "",
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    body: input.body || "",
    links: Array.isArray(input.links)
      ? input.links.filter((link) => link.label?.trim() && link.url?.trim())
      : [],
    createdAt: previous?.createdAt || input.createdAt || now,
    updatedAt: now
  };
}

export function validatePost(post: Post) {
  if (!post.title && !post.thumbnail && post.images.length === 0) {
    return "タイトルまたは画像を入れてください。画像だけの投稿もOKです。";
  }
  return null;
}
