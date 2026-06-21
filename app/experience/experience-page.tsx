"use client";

import { useEffect, useMemo, useState } from "react";
import { experienceCategories, filterExperiences, sortExperiences, type Experience, type ExperienceCategory, type ExperienceSort } from "@/lib/experiences";
import { ExperienceCard } from "./experience-card";

type ExperiencePageProps = {
  experiences: Experience[];
  initialCategory: "all" | ExperienceCategory;
};

const favoritesKey = "yokobo-experience-favorites";

export function ExperiencePage({ experiences, initialCategory }: ExperiencePageProps) {
  const [category, setCategory] = useState<"all" | ExperienceCategory>(initialCategory);
  const [sort, setSort] = useState<ExperienceSort>("newest");
  const [saved, setSaved] = useState<number[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(favoritesKey) ?? "[]") as unknown;
      if (Array.isArray(stored)) setSaved(stored.filter((value): value is number => typeof value === "number"));
    } catch {
      window.localStorage.removeItem(favoritesKey);
    }
  }, []);

  const visibleExperiences = useMemo(() => {
    const filtered = filterExperiences(experiences, category);
    return sortExperiences(savedOnly ? filtered.filter((item) => saved.includes(item.archiveNo)) : filtered, sort);
  }, [category, experiences, saved, savedOnly, sort]);

  function selectCategory(nextCategory: "all" | ExperienceCategory) {
    setCategory(nextCategory);
    setSavedOnly(false);
    const url = nextCategory === "all" ? "/experience" : `/experience?category=${nextCategory}`;
    window.history.replaceState(null, "", url);
  }

  function openRandomExperience() {
    const live = experiences.filter((item) => item.status === "live");
    const selected = live[Math.floor(Math.random() * live.length)];
    if (selected) window.open(selected.playUrl, "_blank", "noopener,noreferrer");
  }

  function toggleSaved(archiveNo: number) {
    setSaved((current) => {
      const next = current.includes(archiveNo) ? current.filter((item) => item !== archiveNo) : [...current, archiveNo];
      window.localStorage.setItem(favoritesKey, JSON.stringify(next));
      return next;
    });
  }

  return (
    <main className="experiencePage experiencePage--transfer">
      <section className="experienceHero" aria-labelledby="experience-title">
        <div className="experienceHeroCopy">
          <p className="experiencePlate">転送室 <span>/ TRANSFER ROOM</span></p>
          <h1 id="experience-title">体験格納庫</h1>
          <p className="experienceLead">過去の創作世界へ冒険するための転送室。<br />ゲーム・3D・ツール・Webの世界へ出発しよう。</p>
          <div className="experienceHeroActions">
            <button className="experienceHeroPrimary" type="button" onClick={openRandomExperience}><span className="experienceWarpIcon" aria-hidden="true"><span>●</span></span> ランダムで転送する</button>
            <a className="experienceHeroSecondary" href="#destinations"><span aria-hidden="true">▣</span> 行き先を見る</a>
          </div>
          <div className="experienceHeroMessage experienceHeroMessage--desktop">
            <strong><span aria-hidden="true">🐾</span> Dr.よこぼからのメッセージ</strong>
            <p>いらっしゃい！ ここでは、よこぼAIラボで生まれた世界にいつでも転送できるよ。気になる世界を選んでね！</p>
          </div>
        </div>
      </section>

      <aside className="experienceHeroMessage experienceHeroMessage--mobile" aria-label="Dr.よこぼからのメッセージ">
        <strong><span aria-hidden="true">🐾</span> Dr.よこぼからのメッセージ</strong>
        <p>気になる世界を選んで、転送してみよう！</p>
      </aside>

      <section className="experienceCollection" id="destinations" aria-label="転送先一覧">
        <div className="experienceToolbar">
          <div className="experienceFilters" role="tablist" aria-label="行き先カテゴリ">
            {experienceCategories.map((item) => (
              <button key={item.slug} type="button" role="tab" aria-selected={!savedOnly && category === item.slug} className={!savedOnly && category === item.slug ? "active" : ""} onClick={() => selectCategory(item.slug)}>
                <span aria-hidden="true">{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div className="experienceToolbarMeta">
            <button className={`experienceSavedDestinations${savedOnly ? " active" : ""}`} type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((current) => !current)}>🐾 保存した世界を見る</button>
            <strong>{savedOnly ? `${visibleExperiences.length} 件` : `${visibleExperiences.length} DESTINATIONS`}</strong>
            <label>並び順
              <select value={sort} onChange={(event) => setSort(event.target.value as ExperienceSort)}>
                <option value="newest">新しい順</option>
                <option value="archive">番号順</option>
                <option value="title">タイトル順</option>
              </select>
            </label>
          </div>
        </div>

        {visibleExperiences.length > 0 ? (
          <div className="experienceGrid">
            {visibleExperiences.map((experience) => <ExperienceCard key={experience.archiveNo} experience={experience} saved={saved.includes(experience.archiveNo)} onToggleSaved={toggleSaved} />)}
          </div>
        ) : (
          <div className="experienceEmpty">
            <span aria-hidden="true">◎</span>
            <h2>この転送ゲートは待機中です</h2>
            <p>{savedOnly ? "保存した行き先はまだありません。肉球ボタンで世界を登録できます。" : "別の行き先カテゴリを選んでください。"}</p>
          </div>
        )}
      </section>
    </main>
  );
}
