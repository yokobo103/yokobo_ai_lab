"use client";

import { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { labHistory } from "../data/labHistory";
import type { HistoryImage, LabHistoryEra } from "../data/labHistory";
import { routes } from "../data/routes";

function Lightbox({ image, onClose }: { image: HistoryImage; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="history-lightbox" role="dialog" aria-modal="true" aria-label={`${image.label} 全体表示`} onClick={onClose}>
      <div className="history-lightbox__panel" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{image.label}</strong>
          <span>縦にスクロールして全体を閲覧できます</span>
          <button type="button" onClick={onClose} aria-label="全体表示を閉じる">×</button>
        </header>
        <div className="history-lightbox__scroll">
          <img src={image.src} alt={`${image.label}のフルページキャプチャ`} loading="lazy" />
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({ era }: { era: LabHistoryEra }) {
  return (
    <div className="history-browser">
      <div className="history-browser__bar">
        <span className="history-browser__dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="history-browser__url">{era.url}</span>
      </div>
      <div className="history-browser__viewport" tabIndex={0} aria-label={`${era.mainImage.label}。枠内を縦にスクロールできます`}>
        <img src={era.mainImage.src} alt={`${era.mainImage.label}のフルページキャプチャ`} loading="lazy" />
      </div>
      <span className="history-browser__hint" aria-hidden="true">↕ スクロールで全体を見る</span>
    </div>
  );
}

function ExhibitCard({ era, onOpen }: { era: LabHistoryEra; onOpen: (image: HistoryImage) => void }) {
  return (
    <article className="history-exhibit">
      <span className="history-exhibit__dot" aria-hidden="true" />
      <header className="history-exhibit__header">
        <span>{era.room}</span>
        <div><h2>{era.era}</h2><p>{era.period}</p></div>
      </header>
      <BrowserFrame era={era} />
      <div className="history-caption">
        <p>{era.concept}</p>
        <ul aria-label="技術と特徴">{era.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </div>
      {era.subImages.length > 0 ? (
        <div className="history-subpages">
          <h3>同時代の展示資料</h3>
          <div className="history-subpages__grid">
            {era.subImages.map((image) => (
              <button type="button" key={image.src} onClick={() => onOpen(image)} aria-label={`${image.label}を全体表示`}>
                <span className="history-subpages__image"><img src={image.src} alt="" loading="lazy" /><i aria-hidden="true">＋</i></span>
                <strong>{image.label}</strong><small>全体を見る</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function HistoryMuseumPage() {
  const [selectedImage, setSelectedImage] = useState<HistoryImage | null>(null);
  return (
    <div className="read-page history-page">
      <div className="paper-grain" aria-hidden="true" />
      <main className="history-page__main">
        <nav className="history-breadcrumb" aria-label="パンくず">
          <a href={routes.home}>ラボ</a><span aria-hidden="true">/</span><a href={routes.read}>資料室</a><span aria-hidden="true">/</span><span>歴史資料館</span>
        </nav>
        <header className="history-hero">
          <p className="read-eyebrow">HISTORY MUSEUM ┃ 歴史をたどる</p>
          <h1>歴史資料館</h1>
          <p>よこぼのAIラボが歩いてきた、3つの時代。展示窓をスクロールしながら、サイトの変遷をたどれます。</p>
        </header>
        <div className="history-timeline">{labHistory.map((era) => <ExhibitCard key={era.room} era={era} onOpen={setSelectedImage} />)}</div>
        <a className="history-to-present" href={routes.home}><small>THE STORY CONTINUES</small><strong>そして現在へ <span aria-hidden="true">→</span></strong></a>
      </main>
      <Footer />
      {selectedImage ? <Lightbox image={selectedImage} onClose={() => setSelectedImage(null)} /> : null}
    </div>
  );
}
