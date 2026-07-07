import type { AuthorId } from "./authors";
import type { ResultStatusId } from "./result-statuses";

export const categories = [
  "画像・動画あそび",
  "AIしくみあそび",
  "3D・空間あそび",
  "ゲームあそび",
  "Webあそび",
  "気づき・ログ"
] as const;

export type Category = (typeof categories)[number];

export const researchLogCategories = ["開発ログ", "考えたこと", "失敗の記録", "お知らせ"] as const;

export type ResearchLogCategory = (typeof researchLogCategories)[number];

export type Post = {
  id: string;
  title: string;
  summary: string;
  author: AuthorId;
  experimentResult: string;
  resultStatus: ResultStatusId;
  category: Category;
  categories: Category[];
  status: "draft" | "public";
  pinned?: boolean;
  logCategory?: ResearchLogCategory;
  tags: string[];
  thumbnail: string;
  images: string[];
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
};
