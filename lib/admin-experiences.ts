import { promises as fs } from "fs";
import path from "path";
import { isGitHubStorageEnabled, readTextFromGitHub, writeTextToGitHub } from "./github-storage";

export type AdminExperience = {
  archiveNo: number;
  title: string;
  category: string;
  summary: string;
  thumbnail?: string;
  labThumbnail?: string;
  tags?: string[];
  playUrl?: string;
  relatedPostId?: string;
  relatedPostIds?: string[];
  localSource?: string;
  status?: "live" | "wip";
  featured?: boolean;
  addedAt?: string;
  visualVariant?: string;
  visualDensity?: string;
};

const dataPath = path.join(process.cwd(), "data", "experiences.json");
export const adminExperienceCategories = ["game", "tool", "3d-ar", "web", "av", "prototype"] as const;
export type AdminExperienceCategory = (typeof adminExperienceCategories)[number];

export async function readAdminExperiences(): Promise<AdminExperience[]> {
  if (isGitHubStorageEnabled()) {
    const raw = await readTextFromGitHub("data/experiences.json");
    return JSON.parse(raw || "[]") as AdminExperience[];
  }

  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw) as AdminExperience[];
}

export async function writeAdminExperiences(experiences: AdminExperience[]) {
  const content = `${JSON.stringify(experiences, null, 2)}\n`;

  if (isGitHubStorageEnabled()) {
    await writeTextToGitHub("data/experiences.json", content, "Update experiment settings from admin");
    return;
  }

  await fs.writeFile(dataPath, content, "utf8");
}

export function normalizeLabThumbnail(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed;
  return "";
}

export function normalizeAdminExperienceUrl(value: unknown) {
  return normalizeLabThumbnail(value);
}

export function normalizeAdminExperienceCategory(value: unknown): AdminExperienceCategory | null {
  return adminExperienceCategories.includes(value as AdminExperienceCategory) ? (value as AdminExperienceCategory) : null;
}

export function normalizeStringList(value: unknown, maxLength = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => (typeof item === "string" ? item.trim().replace(/^#/, "") : "")).filter(Boolean))].slice(0, maxLength);
}

export function getExperienceRelatedPostIds(experience: Pick<AdminExperience, "relatedPostId" | "relatedPostIds">) {
  return [...new Set([...(Array.isArray(experience.relatedPostIds) ? experience.relatedPostIds : []), experience.relatedPostId].filter(Boolean) as string[])];
}
