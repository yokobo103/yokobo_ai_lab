import Image from "next/image";
import Link from "next/link";
import { getPostCategories, logCategoryLinks } from "@/lib/log-categories";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function makeExcerpt(post: { summary: string; body: string }) {
  const source = post.summary || post.body || "画像を置いたら、もう投稿。";
  return source
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\([^)]*\)/g, " ")
    .replace(/[#*>`_\-\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 62) || "画像を置いたら、もう投稿。";
}

function toLogCard(post: Awaited<ReturnType<typeof readPosts>>[number]) {
  return {
    href: `/posts/${post.id}`,
    category: getPostCategories(post).join(" / "),
    date: formatPostDate(post.updatedAt || post.createdAt),
    title: post.title || "無題のあそび",
    summary: makeExcerpt(post),
    image: post.thumbnail || post.images[0] || "/assets/logs/thumb-future-lab.webp"
  };
}

export default async function Home() {
  const posts = (await readPosts()).filter((post) => post.status === "public");
  const latestPosts = posts.slice(0, 4).map(toLogCard);
  const weeklyPickups = posts.filter((post) => post.weeklyPickup).slice(0, 3).map(toLogCard);
  const archivePickups = posts.filter((post) => post.archivePickup).slice(0, 2).map(toLogCard);

  return (
    <div className="pageFrame lpPage">
      <SiteHeader />
      <main>
        <section className="lpHero" aria-labelledby="hero-title">
          <div className="lpHeroShade" />

          <div className="lpHeroInner">
            <div className="lpHeroCopy">
              <h1 id="hero-title">
                AIで<span className="blueText">遊び、</span>
                <br />
                気づけば自分が<span className="pinkText">変わっていた。</span>
              </h1>
              <p>
                画像生成、ゲーム制作、3D、AIツールの実験まで。
                <br />
                思いつきを形にしながら、未来の自分に出会えるラボです。
              </p>
              <div className="lpHeroActions" aria-label="メイン導線">
                <Link className="lpButton primary" href="/logs">
                  ラボをのぞいてみる
                  <Image src="/assets/decor/paw-white.svg" alt="" width={24} height={24} />
                </Link>
                <Link className="lpButton secondary" href="/about">
                  <Image src="/assets/decor/flask-button.svg" alt="" width={26} height={26} />
                  <span>
                    はじめての方へ
                    <small>よこぼのAIラボってなに？</small>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="themes" className="themeSection" aria-labelledby="theme-heading">
          <div className="sectionInner">
            <h2 id="theme-heading" className="pawHeading">
              <Image src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
              気になるテーマを選んでみてにゃ
              <Image src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
            </h2>
            <nav className="themePills" aria-label="テーマ">
              {logCategoryLinks.map((theme) => (
                <Link
                  className={`themePill${"warm" in theme ? " warm" : ""}`}
                  href={theme.href}
                  key={theme.slug}
                  aria-label={theme.label}
                  title={theme.label}
                >
                  <Image className="themeIconSvg" src={theme.icon} alt="" width={32} height={32} />
                  <span className="themeLabelFull">{theme.label}</span>
                  <span className="themeLabelShort" aria-hidden="true">{theme.shortLabel}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="latestSection" aria-labelledby="latest-heading">
          <div className="sectionInner latestInner">
            <div className="latestHeader">
              <div className="latestTitle">
                <Image src="/assets/decor/flask-button.svg" alt="" width={34} height={34} />
                <h2 id="latest-heading">最新の発見ログ</h2>
                <p>ラボで生まれた最新の発見をチェック！</p>
              </div>
              <Link className="textArrowLink" href="/logs">
                すべての発見ログを見る
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="latestLayout">
              <div className="logScroller" aria-label="発見ログ一覧">
                {latestPosts.map((log) => (
                  <Link className="logCard" href={log.href} key={log.href}>
                    <div className="logThumb">
                      <Image src={log.image} alt="" fill sizes="(max-width: 760px) 260px, 230px" />
                      <span>{log.category}</span>
                    </div>
                    <time>{log.date}</time>
                    <h3>{log.title}</h3>
                    <p>{log.summary}</p>
                    <span className="circleArrow" aria-hidden="true">→</span>
                  </Link>
                ))}
                {latestPosts.length === 0 ? (
                  <Link className="logCard" href="/logs">
                    <div className="logThumb">
                      <Image src="/assets/logs/thumb-future-lab.webp" alt="" fill sizes="(max-width: 760px) 260px, 230px" />
                      <span>準備中</span>
                    </div>
                    <time>--</time>
                    <h3>公開中のログはまだありません</h3>
                    <p>新しい実験ログを準備中です。</p>
                    <span className="circleArrow" aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>

              <section className="newsletterPanel" aria-labelledby="newsletter-heading">
                <div className="newsletterCopy">
                  <h2 id="newsletter-heading">
                    一緒に、未来を研究しよう！
                    <Image src="/assets/decor/paw-white.svg" alt="" width={26} height={26} />
                  </h2>
                  <p>新しい発見やお役立ち情報をお届けします。</p>
                  <div className="emailNotice" aria-label="メール配信は整備中です">
                    <svg className="emailIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
                      <rect x="3" y="6" width="18" height="12" rx="3" />
                      <path d="m4.5 8 7.5 5 7.5-5" />
                    </svg>
                    メール配信は整備中です
                    <Image src="/assets/decor/paw-navy.svg" alt="" width={22} height={22} />
                  </div>
                  <Link className="xHandleBanner" href="https://x.com/yokobo_ai" target="_blank" rel="noreferrer" aria-label="Xで @yokobo_ai を開く">
                    <Image src="/assets/social/x-yokobo-ai.svg" alt="@yokobo_ai" width={760} height={132} />
                  </Link>
                  <p className="snsLabel">SNSでも発信中！</p>
                </div>
                <Image
                  className="newsletterCat"
                  src="/assets/characters/yokobo-reference.webp"
                  alt=""
                  width={300}
                  height={300}
                />
              </section>
            </div>
          </div>
        </section>

        <section className="featuredLabSection" aria-labelledby="featured-heading">
          <div className="sectionInner featuredLabGrid">
            <section className="weeklyPickupPanel" aria-labelledby="featured-heading">
              <div className="featureBadge">
                <Image src="/assets/decor/flask-button.svg" alt="" width={26} height={26} />
                <h2 id="featured-heading">今週のピックアップ実験ログ</h2>
                <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
              </div>
              <div className="featurePanelBody">
                <div className="featureLead">
                  <p className="featureCatch">これはすごい発見かも...！</p>
                  <p>Dr.よこぼが厳選した、今週のイチオシ実験を紹介します！</p>
                </div>
                <Image
                  className="featureCharacter doctor"
                  src="/assets/featured/dr-yokobo-pickup.webp"
                  alt=""
                  width={520}
                  height={520}
                />
                <div className="featureList">
                  {weeklyPickups.map((log) => (
                    <Link className="featureMiniCard" href={log.href} key={log.href}>
                      <Image src={log.image} alt="" width={112} height={82} />
                      <span>
                        <small>{log.category}</small>
                        <strong>{log.title}</strong>
                        <time>{log.date}</time>
                      </span>
                    </Link>
                  ))}
                  {weeklyPickups.length === 0 ? (
                    <div className="featureEmpty">
                      <strong>ピックアップは準備中です</strong>
                      <p>管理画面で「今週のピックアップ実験ログ」を選ぶとここに表示されます。</p>
                    </div>
                  ) : null}
                </div>
              </div>
              <Link className="featureMoreButton" href="/logs">
                ピックアップをもっと見る
                <span aria-hidden="true">＋</span>
              </Link>
            </section>

            <section className="archivePickupPanel" aria-labelledby="archive-heading">
              <div className="featureBadge blue">
                <Image src="/assets/decor/flask-button.svg" alt="" width={26} height={26} />
                <h2 id="archive-heading">発掘！過去の実験ログ</h2>
                <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
              </div>
              <div className="archivePanelBody">
                <div className="featureLead">
                  <p className="archiveCatch">ニャビットが掘り出したにゃ！</p>
                  <p>過去の実験の中から、今読んでも面白いログを発掘してきたよ！</p>
                </div>
                <div className="archiveList">
                  {archivePickups.map((log) => (
                    <Link className="archiveMiniCard" href={log.href} key={log.href}>
                      <Image src={log.image} alt="" width={92} height={72} />
                      <span>
                        <small>{log.category}</small>
                        <strong>{log.title}</strong>
                        <time>{log.date}</time>
                      </span>
                    </Link>
                  ))}
                  {archivePickups.length === 0 ? (
                    <div className="featureEmpty compact">
                      <strong>発掘ログは準備中です</strong>
                      <p>管理画面で「発掘！過去の実験ログ」を選ぶとここに表示されます。</p>
                    </div>
                  ) : null}
                </div>
                <Image
                  className="featureCharacter nyabbit"
                  src="/assets/featured/nyabbit-archive.webp"
                  alt=""
                  width={520}
                  height={520}
                />
              </div>
              <Link className="featureMoreButton blue" href="/logs">
                発掘ログをもっと見る
                <span aria-hidden="true">＋</span>
              </Link>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
