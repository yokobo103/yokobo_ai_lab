export type LogStatus = "success" | "tuning" | "fail" | null;
export type LogCategory = "開発ログ" | "考えたこと" | "失敗の記録" | "お知らせ";

export type ResearchLog = {
  id: string;
  date: string;
  status: LogStatus;
  category: LogCategory;
  author: string;
  title: string;
  excerpt: string;
  tags: string[];
  href?: string;
  thumbnail?: string;
  slug: string;
};

export const logCategories = ["すべて", "開発ログ", "考えたこと", "失敗の記録", "お知らせ"] as const;

export type LogFilter = (typeof logCategories)[number];

export function statusLabel(status: LogStatus) {
  if (status === "success") return "成功";
  if (status === "tuning") return "調整中";
  if (status === "fail") return "失敗";
  return null;
}
