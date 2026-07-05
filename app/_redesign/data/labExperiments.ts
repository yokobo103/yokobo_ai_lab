import experiences from "@/data/experiences.json";

export type LabExperiment = {
  id: string;
  title: string;
  summary: string;
  href: string;
  image: string;
  status: "LIVE" | "HOT" | "NEW" | "LAB";
  category: string;
  tags: string[];
  featured?: boolean;
  relatedPostId?: string;
  relatedPostIds?: string[];
};

type SourceExperience = {
  archiveNo?: number;
  title?: string;
  category?: string;
  summary?: string;
  thumbnail?: string;
  tags?: string[];
  playUrl?: string;
  relatedPostId?: string;
  relatedPostIds?: string[];
  status?: "live" | "wip";
  featured?: boolean;
};

const categoryLabels: Record<string, string> = {
  game: "ゲーム",
  tool: "ツール",
  "3d-ar": "3D・AR",
  web: "Web",
  av: "動画・音声",
  prototype: "プロトタイプ",
};

function toStatus(experience: SourceExperience, index: number): LabExperiment["status"] {
  if (experience.status === "wip") return "LAB";
  if (experience.featured) return "HOT";
  if (index < 3) return "NEW";
  return "LIVE";
}

export const labExperiments: LabExperiment[] = (experiences as SourceExperience[]).map((experience, index) => {
  const archiveNo = experience.archiveNo ?? index + 1;
  const category = categoryLabels[experience.category ?? ""] ?? experience.category ?? "その他";

  return {
    id: `DEST-${String(archiveNo).padStart(3, "0")}`,
    title: experience.title ?? "",
    summary: experience.summary ?? "",
    href: experience.playUrl ?? "#",
    image: experience.thumbnail || "/assets/entrances/play.webp",
    status: toStatus(experience, index),
    category,
    tags: Array.isArray(experience.tags) ? experience.tags.slice(0, 5) : [],
    featured: Boolean(experience.featured),
    relatedPostId: experience.relatedPostId,
    relatedPostIds: experience.relatedPostIds,
  };
});

export const labCategories = ["すべて", ...Array.from(new Set(labExperiments.map((experiment) => experiment.category)))] as const;
