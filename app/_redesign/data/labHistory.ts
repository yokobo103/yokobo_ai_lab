export type HistoryImage = {
  src: string;
  label: string;
};

export type LabHistoryEra = {
  room: string;
  era: string;
  period: string;
  concept: string;
  tags: string[];
  url: string;
  mainImage: HistoryImage;
  subImages: HistoryImage[];
};

// TODO(history-copy): コンセプト文は、よこぼ確認前の仮テキスト。
export const labHistory: LabHistoryEra[] = [
  {
    room: "第1展示室",
    era: "ピクセル猫とGitHub Pages時代",
    period: "2025.11.25 公開 〜 2026.04.27",
    concept:
      "プログラミング初心者のよこぼが、AI遊びの記録を置き始めた原点。ピクセルアートの猫と手作り感のあるMarkdown実験ログ。",
    tags: ["GitHub Pages", "Markdown運用", "ピクセルアート"],
    url: "https://yokobo103.github.io/AI-Lab-Site/",
    mainImage: { src: "/history/1_1st_yokobo-ai-lab_top.webp", label: "初代トップページ" },
    subImages: [],
  },
  {
    room: "第2展示室",
    era: "青い研究所デザイン時代",
    period: "2026.04.28 公開 〜 2026.07.08",
    concept:
      "『AIで遊び、気づけば自分が変わっていた。』Dr.よこぼとニャビットが登場し、発見ログ・体験格納庫・ポッドキャストとコンテンツが一気に拡充した時代。",
    tags: ["発見ログ", "体験格納庫", "ポッドキャスト"],
    url: "https://yokobo-ai-lab.vercel.app/",
    mainImage: { src: "/history/2_2nd_yokobo-ai-lab_top.webp", label: "2代目トップページ" },
    subImages: [
      { src: "/history/3_2nd_lab_log.webp", label: "発見ログ" },
      { src: "/history/4_2nd_lab_setsumei.webp", label: "ラボ説明" },
      { src: "/history/5_2nd_lab_experience.webp", label: "体験ページ" },
    ],
  },
  {
    room: "第3展示室",
    era: "遊ぶ？読む？二層構造時代",
    period: "2026.07.08 大規模改修完了 〜 現在",
    concept:
      "遊ぶ側の『実験室』と読む側の『資料室』にサイトを二分。転送室（ランダム移動）も備えた現行デザイン。",
    tags: ["実験室", "資料室", "転送室"],
    url: "https://yokobo-ai-lab.vercel.app/",
    mainImage: { src: "/history/6_3rd_lab_top.webp", label: "3代目トップページ" },
    subImages: [
      { src: "/history/7_3rd_lab_experiment.webp", label: "実験室" },
      { src: "/history/8_3rd_lab_read.webp", label: "資料室" },
      { src: "/history/9_3rd_lab_info.webp", label: "ラボ案内" },
    ],
  },
];
