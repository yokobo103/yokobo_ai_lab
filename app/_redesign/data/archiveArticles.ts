import posts from "@/data/posts.json";

export type ArchiveArticle = {
  id: string;
  title: string;
  summary: string;
  author: string;
  experimentResult: string;
  resultStatus: string;
  category: string;
  categories: string[];
  logCategory?: "開発ログ" | "考えたこと" | "失敗の記録" | "お知らせ";
  status: "draft" | "public";
  tags: string[];
  thumbnail: string;
  images: string[];
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  sourceRepo?: string;
};

type SourcePost = Partial<ArchiveArticle> & {
  pinned?: boolean;
  weeklyPickup?: boolean;
  archivePickup?: boolean;
};

function normalizeArticle(post: SourcePost): ArchiveArticle {
  return {
    id: post.id ?? "",
    title: post.title ?? "",
    summary: post.summary ?? "",
    author: post.author ?? "dr-yokobo",
    experimentResult: post.experimentResult ?? "",
    resultStatus: post.resultStatus ?? "researching",
    category: post.category ?? "",
    categories: Array.isArray(post.categories) ? post.categories : [],
    logCategory: post.logCategory ?? "開発ログ",
    status: post.status === "public" ? "public" : "draft",
    tags: Array.isArray(post.tags) ? post.tags : [],
    thumbnail: post.thumbnail ?? "",
    images: Array.isArray(post.images) ? post.images : [],
    body: post.body ?? "",
    links: Array.isArray(post.links) ? post.links : [],
    createdAt: post.createdAt ?? "",
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? post.createdAt ?? "",
    sourceRepo: post.sourceRepo,
  };
}

function articleTime(article: ArchiveArticle) {
  return Date.parse(article.publishedAt || article.createdAt || article.updatedAt || "") || 0;
}

export const archiveArticles = (posts as SourcePost[])
  .map(normalizeArticle)
  .filter((article) => article.id && article.status === "public")
  .sort((a, b) => articleTime(b) - articleTime(a));

export function getArchiveArticle(slug: string) {
  return archiveArticles.find((article) => article.id === slug) ?? null;
}
