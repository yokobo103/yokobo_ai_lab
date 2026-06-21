import type { Metadata } from "next";
import { filterExperiences, isExperienceCategory, readExperiences } from "@/lib/experiences";
import { SiteFooter, SiteHeader } from "../site-chrome";
import { ExperiencePage } from "./experience-page";

export const metadata: Metadata = {
  title: "体験格納庫 | よこぼのAIラボ",
  description: "よこぼのAIラボで生まれた、遊べる・触れるAI実験のアーカイブ。"
};

type ExperienceRouteProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ExperienceRoute({ searchParams }: ExperienceRouteProps) {
  const params = await searchParams;
  const initialCategory = isExperienceCategory(params.category) ? params.category : "all";
  const experiences = await readExperiences();

  // The initial subset is resolved on the server; the full collection enables instant client-side switching.
  filterExperiences(experiences, initialCategory);

  return (
    <>
      <SiteHeader active="experience" />
      <ExperiencePage experiences={experiences} initialCategory={initialCategory} />
      <SiteFooter />
    </>
  );
}
