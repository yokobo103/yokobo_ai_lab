// 記事ページ(ArchiveArticlePage)の日本語表示と同一の5種。
// 資料室リストでは 成功/失敗 以外は「調整中」に丸めて表示される。
export const resultStatuses = [
  { id: "success", label: "成功", image: "/images/status-badges/status-success.webp" },
  { id: "observation", label: "観察", image: "/images/status-badges/status-observation.webp" },
  { id: "researching", label: "研究中", image: "/images/status-badges/status-researching.webp" },
  { id: "unstable", label: "調整中", image: "/images/status-badges/status-unstable.webp" },
  { id: "failed", label: "失敗", image: "/images/status-badges/status-failed.webp" }
] as const;

export type ResultStatusId = (typeof resultStatuses)[number]["id"];

export const defaultResultStatusId: ResultStatusId = "observation";

export function normalizeResultStatusId(value: unknown): ResultStatusId | null {
  return resultStatuses.some((status) => status.id === value) ? (value as ResultStatusId) : null;
}

export function getResultStatus(value: unknown) {
  return resultStatuses.find((status) => status.id === value) ?? resultStatuses.find((status) => status.id === defaultResultStatusId)!;
}

export function inferResultStatusId(result: string): ResultStatusId {
  if (/失敗|断念/.test(result)) return "failed";
  if (/不安定|暴走|環境依存/.test(result)) return "unstable";
  if (/検証中|継続|要再検証/.test(result)) return "researching";
  if (/観測|再認識|気づき|学び/.test(result)) return "observation";
  if (/成功|大成功/.test(result)) return "success";
  return defaultResultStatusId;
}
