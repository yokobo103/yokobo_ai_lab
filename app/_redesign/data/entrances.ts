// MIGRATION ARTIFACT: EntranceSection is not rendered by the current app/page.tsx.
// Copy in this file, including the old "体験格納庫へ" label, is not current navigation.

import { plannedRoutes, routes } from "./routes";

export type Entrance = {
  id: "play" | "read" | "random";
  title: string;
  body: string;
  buttonLabel: string;
  href?: string;
  plannedHref?: string;
  disabled?: boolean;
  image: string;
  icon: string;
};

export const entrances: Entrance[] = [
  {
    id: "play",
    title: "遊ぶ",
    body: "ゲームや試作をさわりながら、AIのしくみやアイデアを体験する入口。",
    buttonLabel: "体験格納庫へ",
    href: routes.experiments,
    image: "/assets/entrances/play.webp",
    icon: "/assets/icons/flask.webp",
  },
  {
    id: "read",
    title: "読む",
    body: "作ってみたこと、考えたこと、失敗したことを研究ログでたどる入口。",
    buttonLabel: "研究ログへ",
    href: routes.read,
    image: "/assets/entrances/read.webp",
    icon: "/assets/icons/book.webp",
  },
  {
    id: "random",
    title: "ランダム転送",
    body: "まだ知らない実験へ一気に飛ぶ入口。どこへ行くかはお楽しみ。",
    buttonLabel: "準備中",
    plannedHref: plannedRoutes.randomTransfer,
    disabled: true,
    image: "/assets/entrances/random.webp",
    icon: "/assets/icons/transfer.webp",
  },
];
