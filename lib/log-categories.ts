import type { Category, Post } from "./schema";

export const logCategoryLinks = [
  {
    label: "画像・動画あそび",
    shortLabel: "画像・動画",
    slug: "image-video",
    href: "/logs?category=image-video",
    icon: "/assets/play/icons/icon-image-video.svg"
  },
  {
    label: "AIしくみあそび",
    shortLabel: "AIしくみ",
    slug: "ai-system",
    href: "/logs?category=ai-system",
    icon: "/assets/play/icons/icon-ai.svg"
  },
  {
    label: "3D・空間あそび",
    shortLabel: "3D/空間",
    slug: "3d-space",
    href: "/logs?category=3d-space",
    icon: "/assets/play/icons/icon-3d.svg"
  },
  {
    label: "ゲームあそび",
    shortLabel: "ゲーム",
    slug: "game",
    href: "/logs?category=game",
    icon: "/assets/play/icons/icon-game.svg"
  },
  {
    label: "Webあそび",
    shortLabel: "Web",
    slug: "web",
    href: "/logs?category=web",
    icon: "/assets/play/icons/icon-web.svg"
  },
  {
    label: "気づき・ログ",
    shortLabel: "気づき",
    slug: "log",
    href: "/logs?category=log",
    icon: "/assets/play/icons/icon-log.svg"
  },
  {
    label: "ぜんぶみる",
    shortLabel: "ぜんぶ",
    slug: "all",
    href: "/logs",
    icon: "/assets/play/icons/icon-all.svg",
    warm: true
  }
] as const;

export type LogCategorySlug = (typeof logCategoryLinks)[number]["slug"];

const categoryFilters: Record<Exclude<LogCategorySlug, "all">, Category[]> = {
  "image-video": ["画像生成"],
  "ai-system": ["AIツール"],
  "3d-space": ["3D"],
  game: ["ゲーム制作"],
  web: [],
  log: ["失敗ログ", "気づき", "メモ"]
};

export function getLogCategoryLabel(slug?: string) {
  return logCategoryLinks.find((item) => item.slug === slug)?.label;
}

export function filterPostsByLogCategory(posts: Post[], slug?: string) {
  if (!slug || slug === "all") return posts;
  if (!(slug in categoryFilters)) return posts;

  const categories = categoryFilters[slug as Exclude<LogCategorySlug, "all">];
  return posts.filter((post) => categories.includes(post.category));
}
