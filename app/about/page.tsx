import Image from "next/image";
import Link from "next/link";
import { logCategoryLinks } from "@/lib/log-categories";
import { SiteFooter, SiteHeader } from "../site-chrome";

const dialogue = [
  {
    speaker: "Dr.よこぼ",
    avatar: "/design-reference/yokobo_reference.png",
    text: "AIに出会って、\n世界がガラッと広がったんだ。"
  },
  {
    speaker: "ニャビット",
    avatar: "/design-reference/reference_nyabitto.png",
    text: "そんなに変わるものなの？"
  },
  {
    speaker: "Dr.よこぼ",
    avatar: "/design-reference/yokobo_reference.png",
    text: "うん。できることが一気に増えて、\n毎日がちょっとずつ楽しくなっていった。"
  },
  {
    speaker: "ニャビット",
    avatar: "/design-reference/reference_nyabitto.png",
    text: "へえ〜！それで、\nこのラボを作ったんだね！"
  },
  {
    speaker: "Dr.よこぼ",
    avatar: "/design-reference/yokobo_reference.png",
    text: "そう。いろんな“ワクワク”を\nみんなと分かち合う場所にしたくて。"
  }
];

const values = [
  {
    icon: "game",
    title: "遊ぶことを、いちばんに。",
    text: "まずは触ってみる。楽しむことから始めよう。"
  },
  {
    icon: "flask",
    title: "失敗は、いい実験。",
    text: "うまくいかなくても、それも大事な発見。"
  },
  {
    icon: "cube",
    title: "小さく試して、つくっていく。",
    text: "アイデアを形にして、少しずつ前へ。"
  },
  {
    icon: "share",
    title: "みんなで、ワクワクをシェア。",
    text: "学んだことや気づきを、自由に分かち合おう。"
  }
];

const labTourItems = [
  {
    ...logCategoryLinks[0],
    text: "アイデアをカタチにして、世界観やキャラをつくる。",
  },
  {
    ...logCategoryLinks[1],
    text: "AIツールを試して、仕組みを体験してみる。",
  },
  {
    ...logCategoryLinks[2],
    text: "3Dモデルや空間をつくって、新しい表現にチャレンジ。",
  },
  {
    ...logCategoryLinks[3],
    text: "小さなアイデアから、遊べるゲームをつくる。",
  },
  {
    ...logCategoryLinks[4],
    text: "Webサイトやアプリをつくって公開してみる。",
  },
  {
    ...logCategoryLinks[5],
    text: "試したことや学んだことを、ログとして残していく。",
  },
  {
    ...logCategoryLinks[6],
    text: "いろんなジャンルの実験や遊びをのぞいてみる。",
  }
];

const logThumbs = [
  "/assets/logs/thumb-comfyui-cat.webp",
  "/assets/logs/thumb-rpg-game.webp",
  "/assets/logs/thumb-chatgpt-prompt.webp",
  "/assets/logs/thumb-future-lab.webp"
];

function TourIcon({ name }: { name: string }) {
  const props = {
    className: "tourIcon",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  switch (name) {
    case "media":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="14" height="12" rx="3" />
          <path d="m8 14 2.4-2.3a1 1 0 0 1 1.3 0L15 15" />
          <path d="m17 8 4 2.5-4 2.5" />
        </svg>
      );
    case "ai":
      return (
        <svg {...props}>
          <path d="M8 4v3" />
          <path d="M16 4v3" />
          <rect x="5" y="7" width="14" height="11" rx="4" />
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
          <path d="M10 15h4" />
        </svg>
      );
    case "space":
    case "cube":
      return (
        <svg {...props}>
          <path d="M12 3 5 7v10l7 4 7-4V7l-7-4Z" />
          <path d="M12 12 5.4 7.4" />
          <path d="M12 12v8.5" />
          <path d="m12 12 6.6-4.6" />
        </svg>
      );
    case "game":
      return (
        <svg {...props}>
          <path d="M7 14h3" />
          <path d="M8.5 12.5v3" />
          <path d="M15 13.5h.01" />
          <path d="M17.5 15h.01" />
          <path d="M7.2 9h9.6a4.2 4.2 0 0 1 4 5.5l-.7 2.2a2.2 2.2 0 0 1-3.6.9L14.8 16H9.2l-1.7 1.6a2.2 2.2 0 0 1-3.6-.9l-.7-2.2A4.2 4.2 0 0 1 7.2 9Z" />
        </svg>
      );
    case "web":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 9h18" />
          <path d="m10 13-2 2 2 2" />
          <path d="m14 13 2 2-2 2" />
        </svg>
      );
    case "log":
      return (
        <svg {...props}>
          <path d="M8 4h7l3 3v13H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
          <path d="M14 4v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "share":
      return (
        <svg {...props}>
          <circle cx="7" cy="12" r="3" />
          <circle cx="17" cy="6" r="3" />
          <circle cx="17" cy="18" r="3" />
          <path d="m9.7 10.7 4.6-3.4" />
          <path d="m9.7 13.3 4.6 3.4" />
        </svg>
      );
    case "flask":
      return (
        <svg {...props}>
          <path d="M9 3h6" />
          <path d="M10 3v6l-5 8a3 3 0 0 0 2.5 4.5h9a3 3 0 0 0 2.5-4.5l-5-8V3" />
          <path d="M8 15h8" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M12 3.5v17" />
          <path d="M3.5 12h17" />
          <path d="M6 6h4v4H6z" />
          <path d="M14 14h4v4h-4z" />
        </svg>
      );
  }
}

export default function AboutPage() {
  return (
    <div className="pageFrame aboutPage">
      <SiteHeader active="about" />
      <main className="aboutMain">
        <nav className="breadcrumb" aria-label="パンくずリスト">
          <Link href="/">ホーム</Link>
          <span aria-hidden="true">›</span>
          <Link href="/about">よこぼについて</Link>
          <span aria-hidden="true">›</span>
          <span>よこぼのAIラボってなに？</span>
        </nav>

        <section className="exHero" aria-labelledby="about-title">
          <div className="exHeroCopy">
            <div className="aboutTitleMark">
              <TourIcon name="flask" />
            </div>
            <h1 id="about-title">よこぼのAIラボってなに？</h1>
            <p>
              AIで遊んで、気づいたことや作ったものを
              <br />
              実験に置いていく、よこぼの小さな研究フィールドです。
            </p>
          </div>
          <div className="exHeroVisual" aria-label="よこぼのAIラボの案内ビジュアル">
            <Image
              src="/design-reference/ex_page.png"
              alt="明るい研究室にいるDr.よこぼとニャビット"
              fill
              priority
              unoptimized
              sizes="(max-width: 900px) 100vw, 820px"
            />
            <div className="exHeroBubble doctor">ここは、AIで“遊んだ記録”を集めた研究ラボだよ。</div>
            <div className="exHeroBubble nyabbit">いろんな実験や遊びがギュッとつまってるにゃ！</div>
          </div>
        </section>

        <section className="originStorySection" aria-labelledby="origin-heading">
          <div className="originStoryHeader">
            <p className="eyebrow">はじまりの話</p>
            <h2 id="origin-heading">
              <span className="originHeadingLine">このラボが生まれた</span>
              <span className="originHeadingLine">きっかけ</span>
            </h2>
          </div>

          <div className="originDialogueList">
            {dialogue.map((item, index) => (
              <article
                className={`originDialogue ${item.speaker === "ニャビット" ? "nyabbit" : "doctor"}`}
                key={`${item.speaker}-${index}`}
              >
                <Image src={item.avatar} alt="" width={86} height={86} priority unoptimized />
                <div className="originBubble">
                  <strong>{item.speaker}</strong>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="originMessage" aria-label="ラボの始まり">
            <Image
              className="originMessageDoctor"
              src="/design-reference/yokobo_reference.png"
              alt=""
              width={180}
              height={180}
              priority
              unoptimized
            />
            <p>
              <span>AIに出会って、できることが一気に広がった。</span>
              <span>その体験が、</span>
              <span>このラボの始まりです。</span>
            </p>
            <Image
              className="originMessageNyabbit"
              src="/design-reference/reference_nyabitto.png"
              alt=""
              width={150}
              height={150}
              priority
              unoptimized
            />
          </div>
        </section>

        <section className="valuesSection" aria-labelledby="values-heading">
          <h2 id="values-heading">このラボで大切にしていること</h2>
          <div className="valueStrip">
            {values.map((item) => (
              <article className="valueCard" key={item.title}>
                <span>
                  <TourIcon name={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="labTourSection" aria-labelledby="tour-heading">
          <div className="sectionLead">
            <h2 id="tour-heading">ラボの中では、こんなことを扱っています</h2>
            <p>気になるテーマから、発見ログをのぞいてみよう！</p>
          </div>
          <div className="labTourGrid">
            {labTourItems.map((item) => (
              <Link className={`labTourTile${"warm" in item ? " warm" : ""}`} href={item.href} key={item.label}>
                <span className="labTourIcon">
                  <Image src={item.icon} alt="" width={34} height={34} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.text}</small>
                <span className="labTourArrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="discoveryCtaSection" aria-label="発見ログへの案内">
          <div>
            <h2>ラボをのぞいてみよう</h2>
            <p>発見ログでは、最新の実験やアイデアを公開中！</p>
            <Link className="aboutButton" href="/logs">
              最新の発見ログを見る
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="miniThumbs" aria-hidden="true">
            {logThumbs.map((src) => (
              <Image src={src} alt="" width={132} height={92} key={src} />
            ))}
          </div>
        </section>

        <section className="finalTourCta" aria-label="ラボへの案内">
          <Image src="/design-reference/reference_nyabitto.png" alt="" width={120} height={120} unoptimized />
          <div>
            <h2>いっしょに、未来を研究しよう！</h2>
            <p>気になるテーマから、あなたのワクワクを見つけてにゃ。</p>
          </div>
          <Link className="aboutButton" href="/">
            ホームにもどる
            <span aria-hidden="true">→</span>
          </Link>
          <Image src="/design-reference/yokobo_reference.png" alt="" width={150} height={150} unoptimized />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
