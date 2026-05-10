export const categories = [
  "画像・動画あそび",
  "AIしくみあそび",
  "3D・空間あそび",
  "ゲームあそび",
  "Webあそび",
  "気づき・ログ"
] as const;

export type Category = (typeof categories)[number];

export type Post = {
  id: string;
  title: string;
  summary: string;
  category: Category;
  categories: Category[];
  status: "draft" | "public";
  pinned?: boolean;
  weeklyPickup?: boolean;
  archivePickup?: boolean;
  tags: string[];
  thumbnail: string;
  images: string[];
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
};
