import updates from "@/data/site-updates.json";

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
