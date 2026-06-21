import Image from "next/image";
import Link from "next/link";
import type { Experience } from "@/lib/experiences";

type ExperienceCardProps = {
  experience: Experience;
  saved: boolean;
  onToggleSaved: (archiveNo: number) => void;
};

function getCategoryLabel(category: Experience["category"]) {
  return category === "3d-ar" ? "3D・AR" : category === "av" ? "動画・音声" : category === "prototype" ? "プロトタイプ" : category === "game" ? "ゲーム" : category === "tool" ? "ツール" : "Web";
}

function getTransferStatus(experience: Experience) {
  if (experience.status === "wip") return "WIP";
  if (experience.archiveNo === 6) return "NEW";
  if (experience.archiveNo === 4) return "HOT";
  return "LIVE";
}

export function ExperienceCard({ experience, saved, onToggleSaved }: ExperienceCardProps) {
  const transferStatus = getTransferStatus(experience);
  const transferLabel = experience.category === "game" || experience.category === "3d-ar" ? "この世界へ行く" : "転送する";
  const extraTags = Math.max(0, experience.tags.length - 3);

  return (
    <article className={`experienceTransferPanel experienceTransferPanel--${experience.category}${experience.status === "wip" ? " isWip" : ""}`}>
      <span className="experienceTransferCorner experienceTransferCorner--tl" aria-hidden="true" />
      <span className="experienceTransferCorner experienceTransferCorner--br" aria-hidden="true" />

      <div className="experienceTransferMeta">
        <span className="experienceTransferCategory">{getCategoryLabel(experience.category)}</span>
        <span className={`experienceTransferStatus experienceTransferStatus--${transferStatus.toLowerCase()}`}>{transferStatus}</span>
      </div>

      <div className="experiencePortalWindow">
        <Image src={experience.thumbnail} alt={`${experience.title}の転送先プレビュー`} fill sizes="(max-width: 479px) 92vw, (max-width: 767px) 46vw, (max-width: 1199px) 30vw, 23vw" />
        <span className="experiencePortalScan" aria-hidden="true" />
        <span className="experiencePortalFrame" aria-hidden="true" />
        <span className="experiencePortalCode" aria-hidden="true">DEST-{String(experience.archiveNo).padStart(3, "0")}</span>
      </div>

      <div className="experienceTransferBody">
        <h2>{experience.title}</h2>
        <p>{experience.summary}</p>
        <div className="experienceTransferTags" aria-label="タグ">
          {experience.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          {extraTags > 0 ? <span>+{extraTags}</span> : null}
        </div>
      </div>

      <div className="experienceTransferActions">
        {experience.status === "live" ? (
          <a className="experienceTransferButton" href={experience.playUrl} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">↝</span> {transferLabel}
          </a>
        ) : (
          <span className="experienceTransferButton isDisabled" aria-disabled="true">準備中</span>
        )}
        <div className="experienceTransferSubActions">
          {experience.relatedPostId ? <Link className="experienceTransferLog" href={`/posts/${experience.relatedPostId}`}>関連ログ</Link> : <span />}
          <button className={`experiencePawSave${saved ? " isSaved" : ""}`} type="button" aria-label={saved ? `${experience.title}の保存を解除` : `${experience.title}を保存`} aria-pressed={saved} onClick={() => onToggleSaved(experience.archiveNo)}>
            <Image src="/assets/decor/paw-white.svg" alt="" width={24} height={24} />
          </button>
        </div>
      </div>
    </article>
  );
}
