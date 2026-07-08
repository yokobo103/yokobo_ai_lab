import { routes } from "../data/routes";

const updates = [
  {
    date: "2026.07.08",
    title: "サイトの大規模改修が完了しました。",
    href: routes.home,
  },
  {
    date: "2026.07.03",
    title: "トップページの入口まわりを整理しました。",
    href: routes.home,
  },
  {
    date: "2026.07.02",
    title: "実験室に「コロコロニャビット」を追加しました。",
    href: routes.experimentAnchor("DEST-008"),
  },
  {
    date: "2026.06.22",
    title: "発見ログ「体験格納庫をつくってみた」を追加しました。",
    href: routes.readArticle("20260620-taiken-kakunouko"),
  },
  {
    date: "2026.06.19",
    title: "ショート動画生成パイプラインの実験ログを追加しました。",
    href: routes.readArticle("20260619-short-video-generation-pipeline"),
  },
  {
    date: "2026.06.19",
    title: "実験ログ制作フローの見直しを記録しました。",
    href: routes.readArticle("20260619-hq-log-workflow-migration"),
  },
  {
    date: "2026.06.18",
    title: "Claude Fableの3Dオープンワールド実験を追加しました。",
    href: routes.readArticle("20260618-claude-fable-open-world"),
  },
  {
    date: "2026.06.18",
    title: "超ミニマムなメモアプリの実験ログを追加しました。",
    href: routes.readArticle("20260614-minimum-memo-app"),
  },
  {
    date: "2026.06.07",
    title: "コロコロニャビット開発プロジェクトの記録を追加しました。",
    href: routes.readArticle("20260530-nyabbit-roll-mobile-game"),
  },
  {
    date: "2026.05.30",
    title: "3Dボクセル研究施設ワールドを追加しました。",
    href: routes.experimentAnchor("DEST-005"),
  },
  {
    date: "2026.05.23",
    title: "よこぼラボファイターズの実験ログを追加しました。",
    href: routes.readArticle("20260522-lab-fighters"),
  },
  {
    date: "2026.05.17",
    title: "1MB HTMLゲームの実験成果を追加しました。",
    href: routes.experimentAnchor("DEST-009"),
  },
  {
    date: "2026.05.08",
    title: "リアルタイム翻訳アプリの実験を追加しました。",
    href: routes.experimentAnchor("DEST-003"),
  },
  {
    date: "2026.05.05",
    title: "猫の森ランの実験ログを追加しました。",
    href: routes.readArticle("323c30ae-d25a-4ef8-b647-117e2b17f933"),
  },
  {
    date: "2026.04.28",
    title: "よこぼのAIラボを仮オープンしました。",
    href: routes.readArticle("welcome-lab"),
  },
];

const visibleUpdates = updates.slice(0, 5);

export function TeaserSection() {
  return (
    <section className="teaser-section" aria-labelledby="teaser-title">
      <div className="top-page-shell">
        <div className="section-heading section-heading--compact">
          <p>News</p>
          <h2 id="teaser-title">更新情報</h2>
        </div>
        <div className="updates-list">
          {visibleUpdates.map((item) => (
            <article className="update-item" key={`${item.date}-${item.title}`}>
              <time dateTime={item.date.replaceAll(".", "-")}>{item.date}</time>
              <p>
                <a href={item.href}>{item.title}</a>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
