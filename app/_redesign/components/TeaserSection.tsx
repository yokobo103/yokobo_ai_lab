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
    date: "2026.06.22",
    title: "発見ログ「体験格納庫をつくってみた」を追加しました。",
    href: routes.readArticle("20260620-taiken-kakunouko"),
  },
];

export function TeaserSection() {
  return (
    <section className="teaser-section" aria-labelledby="teaser-title">
      <div className="top-page-shell">
        <div className="section-heading section-heading--compact">
          <p>News</p>
          <h2 id="teaser-title">更新情報</h2>
        </div>
        <div className="updates-list">
          {updates.map((item) => (
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
