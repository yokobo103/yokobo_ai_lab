export const resultStatuses = [
  { id: "success", label: "SUCCESS", image: "/images/status-badges/status-success.webp" },
  { id: "observation", label: "OBSERVATION", image: "/images/status-badges/status-observation.webp" },
  { id: "researching", label: "RESEARCHING", image: "/images/status-badges/status-researching.webp" },
  { id: "unstable", label: "UNSTABLE", image: "/images/status-badges/status-unstable.webp" },
  { id: "failed", label: "FAILED", image: "/images/status-badges/status-failed.webp" },
  { id: "chaos", label: "CHAOS", image: "/images/status-badges/status-chaos.webp" }
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
  if (/カオス|想定外|なぜか成立/.test(result)) return "chaos";
  if (/失敗|断念/.test(result)) return "failed";
  if (/不安定|暴走|環境依存/.test(result)) return "unstable";
  if (/検証中|継続|要再検証/.test(result)) return "researching";
  if (/観測|再認識|気づき|学び/.test(result)) return "observation";
  if (/成功|大成功/.test(result)) return "success";
  return defaultResultStatusId;
}
