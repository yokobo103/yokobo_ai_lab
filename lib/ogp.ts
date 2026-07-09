import type { Post } from "./schema";

export const defaultOgpImagePath = "/ogp-default.webp";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (configuredUrl || "https://yokobo-ai-lab.vercel.app").replace(/\/+$/, "");
}

export function getAbsoluteUrl(path: string) {
  const value = path.trim();
  if (/^https?:\/\//i.test(value)) return new URL(value).toString();
  return new URL(value.startsWith("/") ? value : `/${value}`, getSiteUrl()).toString();
}

export function getArticleDescription(post: Post) {
  return post.summary || post.body.split("\n").find(Boolean)?.trim() || "よこぼのAIラボの研究ログです。";
}

export function getArticleOgpImage(post: Post) {
  return getAbsoluteUrl(post.thumbnail || defaultOgpImagePath);
}
