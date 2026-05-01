import Image from "next/image";
import Link from "next/link";
import { logCategoryLinks } from "@/lib/log-categories";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

const socialLinks = [
  { label: "X", href: "https://x.com/", icon: "/assets/social/x.svg", tone: "black" },
  { label: "YouTube", href: "https://www.youtube.com/", icon: "/assets/social/video.svg", tone: "red" },
  { label: "音楽", href: "https://www.tiktok.com/", icon: "/assets/social/music.svg", tone: "green" },
  { label: "Instagram", href: "https://www.instagram.com/", icon: "/assets/social/camera.svg", tone: "rainbow" }
];

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export default async function Home() {
  const posts = (await readPosts()).filter((post) => post.status === "public");
  const latestPosts = posts.slice(0, 4).map((post) => ({
    href: `/posts/${post.id}`,
    category: post.category,
    date: formatPostDate(post.updatedAt || post.createdAt),
    title: post.title || "無題のあそび",
    image: post.thumbnail || post.images[0] || "/assets/logs/thumb-future-lab.webp"
  }));

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
                  <p className="snsLabel">SNSでも発信中！</p>
                  <div className="socialList">
                    {socialLinks.map((social) => (
                      <Link
                        className={`socialLink ${social.tone}`}
                        href={social.href}
                        aria-label={social.label}
                        key={social.label}
                      >
                        <Image src={social.icon} alt="" width={26} height={26} />
                      </Link>
                    ))}
                  </div>
                </div>
                <Image
                  className="newsletterCat"
                  src="/assets/cta/dr-yokobo-waving.png"
                  alt=""
                  width={300}
                  height={300}
                />
              </section>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
