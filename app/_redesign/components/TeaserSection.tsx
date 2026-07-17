import updates from "@/data/site-updates.json";
import { archiveArticles } from "../data/archiveArticles";

type UpdateItem = {
  id: string;
  date: string;
  title: string;
  href: string;
};

function formatUpdateDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")}`;
}

const researchLogUpdates: UpdateItem[] = archiveArticles.map((article) => ({
  id: `research-log-${article.id}`,
  date: formatUpdateDate(article.publishedAt || article.createdAt || article.updatedAt),
  title: `研究ログ「${article.title}」を公開しました。`,
  href: `/read/${article.id}`,
}));

const seenHrefs = new Set<string>();
const visibleUpdates = ([...(updates as UpdateItem[]), ...researchLogUpdates] as UpdateItem[])
  .filter((item) => item.date && !seenHrefs.has(item.href) && Boolean(seenHrefs.add(item.href)))
  .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  .slice(0, 5);

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
