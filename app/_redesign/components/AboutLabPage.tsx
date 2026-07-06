import { assets } from "../data/assets";
import { routes } from "../data/routes";
import { Footer } from "./Footer";
import { LabButton } from "./LabButton";

const rooms = [
  {
    key: "experiment",
    mark: "ROOM 1",
    title: "実験室",
    text: "AIと一緒に作ったゲームやツールを、実際に触って試せる場所です。",
    icon: assets.icons.flask,
  },
  {
    key: "archive",
    mark: "ROOM 2",
    title: "資料室",
    text: "考えたこと、失敗したこと、気づいたことを記録している場所です。",
    icon: assets.icons.book,
  },
] as const;

const story = [
  {
    speaker: "Dr.よこぼ",
    side: "doctor",
    avatar: "/assets/characters/dr-yokobo-face.png",
    text: "AIに出会って、世界がガラッと広がったんだよね。",
  },
  {
    speaker: "ニャビット",
    side: "nyabit",
    avatar: "/design-reference/reference_nyabitto.png",
    text: "そんなに変わるものなの？",
  },
  {
    speaker: "Dr.よこぼ",
    side: "doctor",
    avatar: "/assets/characters/dr-yokobo-face.png",
    text: "うん。できることが一気に増えて、毎日がちょっとずつ楽しくなっていった。",
  },
  {
    speaker: "ニャビット",
    side: "nyabit",
    avatar: "/design-reference/reference_nyabitto.png",
    text: "へえ。このラボを作った理由、ちょっと分かった気がする。",
  },
] as const;

const principles = [
  {
    number: "1",
    title: "思ったことを、いちばん先に。",
    text: "まずは触ってみる。楽しいところから始めます。",
  },
  {
    number: "2",
    title: "失敗も、いい発見。",
    text: "うまくいかなかったことも、大事な実験ログです。",
  },
  {
    number: "3",
    title: "小さく試して、つくっていく。",
    text: "アイデアを形にして、少しずつ育てます。",
  },
  {
    number: "4",
    title: "みんなで、ワクワクをシェア。",
    text: "学んだことや変化を、自由に分かち合います。",
  },
] as const;

const topics = [
  {
    title: "画像・動画あそび",
    text: "アイデアをカタチにして、世界観やイメージをつくる。",
    image: "/assets/play/play-image-generation.webp",
  },
  {
    title: "AIしくみあそび",
    text: "AIツールを試して、仕組みを体験してみる。",
    image: "/assets/play/play-ai-tool.webp",
  },
  {
    title: "3D・空間あそび",
    text: "3Dモデルや空間をつくって、新しい表現にチャレンジ。",
    image: "/assets/play/play-3d.webp",
  },
  {
    title: "ゲームあそび",
    text: "小さなアイデアから、遊べるゲームをつくる。",
    image: "/assets/play/play-game.webp",
  },
  {
    title: "Webあそび",
    text: "Webサイトやアプリをつくって公開してみる。",
    image: "/assets/play/icons/icon-web.svg",
  },
  {
    title: "気づき・ログ",
    text: "気づいたことや悩んだことを、ログとして残していく。",
    image: assets.icons.book,
  },
] as const;

function SheetMasthead({ page }: { page: string }) {
  return (
    <div className="about-booklet__masthead">
      <span>よこぼのAIラボ 館内案内</span>
      <span>{page}</span>
    </div>
  );
}

function PageFoot({ page }: { page: string }) {
  return (
    <footer className="about-booklet__pagefoot">
      <span>発行：よこぼのAIラボ</span>
      <span>{page}</span>
    </footer>
  );
}

export function AboutLabPage() {
  return (
    <div className="about-booklet">
      <main className="about-booklet__main">
        <article className="about-booklet__sheet" aria-labelledby="about-title">
          <SheetMasthead page="ご自由にお持ちください" />

          <header className="about-booklet__cover">
            <p className="about-booklet__eyebrow">LAB GUIDE BOOKLET</p>
            <h1 id="about-title">よこぼのAIラボ ってなに？</h1>
            <p className="about-booklet__cover-sub">館内のご案内</p>
            <span className="about-booklet__stamp" aria-hidden="true">
              来館記念
              <b>にゃ</b>
              YOKOBO AI LAB
            </span>
          </header>

          <section className="about-booklet__chapter" aria-labelledby="about-ch1">
            <h2 id="about-ch1">
              <span>1</span>ごあいさつ
            </h2>
            <p>ここは、AIで遊んで、気づいたことや作ったものを実験に置いていく、よこぼの小さな研究フィールドです。</p>
            <p>
              つくること、試すこと、うまくいかないことも全部ふくめて、変化や発見をそっと記録しています。AIと
              <em>遊ぶこと</em>と<em>記録すること</em>を、行ったり来たりする場所です。
            </p>
            <div className="about-booklet__motto">
              <span>遊ぶ</span>
              <b aria-hidden="true">⇄</b>
              <span>記録する</span>
              <small>をくり返すラボです。</small>
            </div>
          </section>

          <section className="about-booklet__chapter" aria-labelledby="about-ch2">
            <h2 id="about-ch2">
              <span>2</span>館内のご案内
            </h2>
            <figure className="about-booklet__figure">
              <img src={assets.about.guideMap} alt="よこぼのAIラボの見取り図。左に実験室、右に資料室が描かれている。" />
              <figcaption>図1｜よこぼのAIラボ 見取り図</figcaption>
            </figure>
            <dl className="about-booklet__legend">
              {rooms.map((room) => (
                <div key={room.key}>
                  <img src={room.icon} alt="" aria-hidden="true" />
                  <dt>
                    <small>{room.mark}</small>
                    {room.title}
                  </dt>
                  <dd>{room.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="about-booklet__tobecontinued">- 次のページへつづく -</p>
          <PageFoot page="p. 1" />
        </article>

        <article className="about-booklet__sheet" aria-labelledby="about-ch3">
          <SheetMasthead page="はじまりの記録" />

          <section className="about-booklet__chapter about-booklet__chapter--first" aria-labelledby="about-ch3">
            <h2 id="about-ch3">
              <span>3</span>このラボが生まれたきっかけ
            </h2>
            <div className="about-booklet__dialogue" aria-label="Dr.よこぼとニャビットの会話">
              {story.map((item, index) => (
                <div className="about-booklet__dialogue-row" key={`${item.speaker}-${index}`}>
                  <img src={item.avatar} alt="" aria-hidden="true" />
                  <p>
                    <b>{item.speaker}</b>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <blockquote className="about-booklet__quote">
              <p>AIに出会って、できることが一気に広がった。</p>
              <p>その体験が、このラボの始まりです。</p>
            </blockquote>
          </section>

          <section className="about-booklet__chapter" aria-labelledby="about-ch4">
            <h2 id="about-ch4">
              <span>4</span>ラボのきまり
            </h2>
            <ol className="about-booklet__principles">
              {principles.map((principle) => (
                <li key={principle.number}>
                  <span>{principle.number}</span>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <PageFoot page="p. 2" />
        </article>

        <article className="about-booklet__sheet" aria-labelledby="about-ch5">
          <SheetMasthead page="扱っていること" />

          <section className="about-booklet__chapter about-booklet__chapter--first" aria-labelledby="about-ch5">
            <h2 id="about-ch5">
              <span>5</span>ラボで扱っていること
            </h2>
            <div className="about-booklet__catalog">
              {topics.map((topic, index) => (
                <article className="about-booklet__topic" key={topic.title}>
                  <figure>
                    <img src={topic.image} alt="" aria-hidden="true" />
                    <figcaption>項目 {String(index + 1).padStart(2, "0")}</figcaption>
                  </figure>
                  <h3>{topic.title}</h3>
                  <p>{topic.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="about-booklet__afterword" aria-label="案内係からの一言">
            <p>よこぼのAIラボ 館内案内</p>
            <p>発行：よこぼのAIラボ</p>
            <p>案内係：Dr.よこぼ ・ ニャビット</p>
          </section>

          <PageFoot page="p. 3" />
        </article>

        <section className="about-booklet__outside-cta" aria-labelledby="about-cta-title">
          <p>それでは、ラボの中へ。</p>
          <h2 id="about-cta-title">好きな部屋から、のぞいてみてください。</h2>
          <div className="about-booklet__actions">
            <LabButton
              href={routes.experiments}
              label="実験室へ"
              icon={assets.icons.flask}
              sprite={assets.ctaSprites.playFlaskHover}
              variant="primary"
            />
            <LabButton
              href={routes.read}
              label="資料室へ"
              icon={assets.icons.book}
              sprite={assets.ctaSprites.readBookHover}
              variant="log"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
