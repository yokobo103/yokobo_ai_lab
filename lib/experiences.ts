import experienceData from "@/data/experiences.json";

export type ExperienceCategory = "game" | "tool" | "3d-ar" | "web" | "av" | "prototype";
export type ExperienceSort = "newest" | "archive" | "title";
export type ExperienceVisualVariant = "forest" | "voxel" | "fighter" | "translation" | "old-site" | "drive" | "default";
export type ExperienceVisualDensity = "low" | "medium" | "high";

export type Experience = {
  archiveNo: number;
  title: string;
  category: ExperienceCategory;
  summary: string;
  thumbnail: string;
  tags: string[];
  playUrl: string;
  relatedPostId?: string;
  localSource?: string;
  status: "live" | "wip";
  featured?: boolean;
  addedAt: string;
  visualVariant?: ExperienceVisualVariant;
  visualDensity?: ExperienceVisualDensity;
};

export const experienceCategories: ReadonlyArray<{
  slug: "all" | ExperienceCategory;
  label: string;
  icon: string;
}> = [
  { slug: "all", label: "すべて", icon: "▦" },
  { slug: "game", label: "ゲーム", icon: "🎮" },
  { slug: "3d-ar", label: "3D・AR", icon: "◇" },
  { slug: "tool", label: "ツール", icon: "⚗" },
  { slug: "web", label: "Web", icon: "◎" },
  { slug: "av", label: "動画・音声", icon: "▶" },
  { slug: "prototype", label: "プロトタイプ", icon: "✣" }
];

export function isExperienceCategory(value?: string): value is ExperienceCategory {
  return experienceCategories.some((category) => category.slug !== "all" && category.slug === value);
}

export async function readExperiences(): Promise<Experience[]> {
  return experienceData as Experience[];
}

export function filterExperiences(experiences: Experience[], category?: string) {
  if (!isExperienceCategory(category)) return [...experiences];
  return experiences.filter((experience) => experience.category === category);
}

export function sortExperiences(experiences: Experience[], sort: ExperienceSort = "newest") {
  return [...experiences].sort((a, b) => {
    if (sort === "archive") return a.archiveNo - b.archiveNo;
    if (sort === "title") return a.title.localeCompare(b.title, "ja");
    return Date.parse(b.addedAt) - Date.parse(a.addedAt) || b.archiveNo - a.archiveNo;
  });
}
