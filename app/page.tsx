import Image from "next/image";
import Link from "next/link";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

const themes = [
  { label: "画像生成", icon: "/assets/play/icons/icon-image.svg" },
  { label: "ゲーム制作", icon: "/assets/play/icons/icon-gamepad.svg" },
  { label: "3D", icon: "/assets/play/icons/icon-cube.svg" },
  { label: "AI実験", icon: "/assets/play/icons/icon-flask.svg" },
  { label: "プロンプト", icon: "/assets/play/icons/icon-share.svg" },
  { label: "キャラ・イラスト", icon: "/assets/concerns/icon-cat-face.svg" },
  { label: "初心者向け", icon: "/assets/vision/icon-creation.svg" },
  { label: "ちょっと試してみる", icon: "/assets/concerns/icon-star.svg", warm: true }
];

const discoveryLogs = [
  {
    category: "画像生成",
    date: "2024.05.13",
    title: "GPT-image2で未来の研究室をつくってみた！",
    image: "/assets/logs/thumb-comfyui-cat.webp"
  },
  {
    category: "3D",
    date: "2024.05.10",
    title: "ニャビットの3DモデルをBlenderで作ってみた",
    image: "/assets/logs/thumb-3d-nyabbit.webp"
  },
  {
    category: "ゲーム制作",
    date: "2024.05.08",
    title: "AI生成素材でRPGの町をつくってみた",
    image: "/assets/logs/thumb-rpg-game.webp"
  },
  {
    category: "AI活用",
    date: "2024.05.05",
    title: "ChatGPTにプロンプト設計を相談してみた",
    image: "/assets/logs/thumb-chatgpt-prompt.webp"
  }
];

const socialLinks = [
  { label: "X", href: "https://x.com/", icon: "/assets/social/x.svg", tone: "black" },
  { label: "YouTube", href: "https://www.youtube.com/", icon: "/assets/social/video.svg", tone: "red" },
  { label: "音楽", href: "https://www.tiktok.com/", icon: "/assets/social/music.svg", tone: "green" },
  { label: "Instagram", href: "https://www.instagram.com/", icon: "/assets/social/camera.svg", tone: "rainbow" }
];

export default async function Home() {
  const posts = (await readPosts()).filter((post) => post.status === "public");
  const logHref = (index: number) => (posts[index]?.id ? `/posts/${posts[index].id}` : "/posts");

  return (
    <div className="pageFrame lpPage">
      <SiteHeader />
      <main>
        <section className="lpHero" aria-labelledby="hero-title">
          <Image
            className="lpHeroBg"
            src="/design-reference/lp_top.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className="lpHeroShade" />
          <Image className="heroDoodle atomOne" src="/assets/decor/atom.svg" alt="" width={58} height={58} />
          <Image className="heroDoodle pawOne" src="/assets/decor/paw-blue.svg" alt="" width={34} height={34} />

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
                <Link className="lpButton primary" href="/posts">
                  ラボをのぞいてみる
                  <Image src="/assets/decor/paw-white.svg" alt="" width={24} height={24} />
                </Link>
                <Link className="lpButton secondary" href="#themes">
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
              {themes.map((theme) => (
                <Link className={`themePill${theme.warm ? " warm" : ""}`} href="/posts" key={theme.label}>
                  <Image src={theme.icon} alt="" width={30} height={30} />
                  <span>{theme.label}</span>
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
              <Link className="textArrowLink" href="/posts">
                すべての発見ログを見る
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="latestLayout">
              <div className="logScroller" aria-label="発見ログ一覧">
                {discoveryLogs.map((log, index) => (
                  <Link className="logCard" href={logHref(index)} key={log.title}>
                    <div className="logThumb">
                      <Image src={log.image} alt="" fill sizes="(max-width: 700px) 260px, 230px" />
                      <span>{log.category}</span>
                    </div>
                    <time>{log.date}</time>
                    <h3>{log.title}</h3>
                    <span className="circleArrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>

              <section className="newsletterPanel" aria-labelledby="newsletter-heading">
                <div className="newsletterCopy">
                  <h2 id="newsletter-heading">
                    一緒に、未来を研究しよう！
                    <Image src="/assets/decor/paw-white.svg" alt="" width={26} height={26} />
                  </h2>
                  <p>新しい発見やお役立ち情報をお届けします。</p>
                  <div className="emailNotice" aria-label="メール配信は整備中です">
                    <span aria-hidden="true">✉</span>
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
