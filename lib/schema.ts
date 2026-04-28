export const categories = [
  "画像生成",
  "ゲーム制作",
  "3D",
  "AIツール",
  "失敗ログ",
  "気づき",
  "メモ"
] as const;

export type Category = (typeof categories)[number];

export type Post = {
  id: string;
  title: string;
  summary: string;
  category: Category;
  status: "draft" | "public";
  tags: string[];
  thumbnail: string;
  images: string[];
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
  updatedAt: string;
};
