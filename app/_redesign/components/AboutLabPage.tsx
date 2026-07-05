import { assets } from "../data/assets";
import { routes } from "../data/routes";
import { Footer } from "./Footer";
import { LabButton } from "./LabButton";

const rooms = [
  {
    key: "experiment",
    title: "実験室",
    text: "AIと一緒に作ったゲームやツールを、実際に触って試せる場所です。",
    icon: assets.icons.flask,
  },
  {
    key: "archive",
    title: "資料室",
    text: "考えたこと、失敗したこと、気づいたことを記録している場所です。",
    icon: assets.icons.book,
  },
] as const;

const story = [
  {
    speaker: "Dr.よこぼ",
    side: "doctor",
    text: "AIに出会って、世界がガラッと広がったんだよね。",
  },
  {
    speaker: "ニャビット",
    side: "nyabit",
    text: "そんなに変わるものなの？",
  },
  {
    speaker: "Dr.よこぼ",
    side: "doctor",
    text: "うん。できることが一気に増えて、毎日がちょっとずつ楽しくなっていった。",
  },
  {
    speaker: "ニャビット",
    side: "nyabit",
    text: "へえ。このラボを作った理由、ちょっと分かった気がする。",
  },
] as const;

const principles = [
  {
    number: "1",
    title: "思ったことを、いちばん先に。",
    text: "まずは触ってみる。楽しいところから始めます。",
    icon: assets.icons.flask,
  },
  {
    number: "2",
    title: "失敗も、いい発見。",
    text: "うまくいかなかったことも、大事な実験ログです。",
    icon: "/assets/play/icons/icon-log.svg",
  },
  {
    number: "3",
    title: "小さく試して、つくっていく。",
    text: "アイデアを形にして、少しずつ育てます。",
    icon: assets.icons.transfer,
  },
  {
    number: "4",
    title: "みんなで、ワクワクをシェア。",
    text: "学んだことや変化を、自由に分かち合います。",
    icon: "/assets/play/icons/icon-share.svg",
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

export function AboutLabPage() {
  return (
    <div className="about-page">
      <main className="about-page__main">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero__copy">
            <p className="about-eyebrow">LAB GUIDE</p>
            <h1 id="about-title">
              <span>よこぼのAIラボ</span>
              <span>ってなに？</span>
            </h1>
            <p className="about-hero__lead">
              AIで遊んで、気づいたことや作ったものを実験に置いていく、よこぼの小さな研究フィールドです。
            </p>
            <p className="about-hero__text">
              つくること、試すこと、うまくいかないことも全部ふくめて、変化や発見をそっと記録しています。
            </p>
            <p className="about-hero__text">ここは、AIと遊ぶことと記録することを、行ったり来たりする場所です。</p>
            <div className="about-hero__tag">
              <img src={assets.icons.flask} alt="" aria-hidden="true" />
              <span>遊ぶ</span>
              <b aria-hidden="true">⇄</b>
              <span>記録する</span>
              <small>をくり返すラボです。</small>
            </div>
          </div>

          <div className="about-map" aria-label="よこぼのAIラボ 館内案内">
            <div className="about-map__frame">
              <img className="about-map__image" src={assets.about.guideMap} alt="" />
              <div className="about-map__label">よこぼのAIラボ 館内案内</div>
              <div className="about-map__rooms">
                {rooms.map((room) => (
                  <article className={`about-room about-room--${room.key}`} key={room.key}>
                    <img src={room.icon} alt="" aria-hidden="true" />
                    <div>
                      <h2>{room.title}</h2>
                      <p>{room.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-origin" aria-labelledby="about-origin-title">
          <div className="about-origin__intro">
            <p>はじまりの頃</p>
            <h2 id="about-origin-title">このラボが生まれたきっかけ</h2>
            <img src={assets.characters.drYokobo} alt="" aria-hidden="true" />
          </div>
          <div className="about-origin__log" aria-label="Dr.よこぼとニャビットの会話">
            {story.map((item, index) => (
              <div className={`about-talk about-talk--${item.side}`} key={`${item.speaker}-${index}`}>
                <img src={item.side === "doctor" ? assets.characters.drYokobo : assets.characters.nyabit} alt="" aria-hidden="true" />
                <p>
                  <b>{item.speaker}</b>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <aside className="about-origin__quote">
            <p>AIに出会って、できることが一気に広がった。</p>
            <p>その体験が、このラボの始まりです。</p>
            <img src={assets.characters.nyabit} alt="" aria-hidden="true" />
          </aside>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-title">
          <div className="about-section-heading">
            <img src="/assets/decor/atom.svg" alt="" aria-hidden="true" />
            <h2 id="about-principles-title">このラボで大切にしていること</h2>
          </div>
          <div className="about-principles__grid">
            {principles.map((principle) => (
              <article className="about-principle" key={principle.number}>
                <span>{principle.number}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </div>
                <img src={principle.icon} alt="" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="about-topics" aria-labelledby="about-topics-title">
          <div className="about-section-heading">
            <h2 id="about-topics-title">ラボの中では、こんなことを扱っています</h2>
          </div>
          <div className="about-topics__grid">
            {topics.map((topic) => (
              <article className="about-topic" key={topic.title}>
                <img src={topic.image} alt="" aria-hidden="true" />
                <h3>{topic.title}</h3>
                <p>{topic.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-closing" aria-labelledby="about-closing-title">
          <img className="about-closing__doctor" src={assets.characters.drYokobo} alt="" aria-hidden="true" />
          <div>
            <p>それでは、ラボの中へ。</p>
            <h2 id="about-closing-title">好きな部屋から、のぞいてみてください。</h2>
            <div className="about-closing__actions">
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
          </div>
          <img className="about-closing__nyabit" src={assets.characters.nyabit} alt="" aria-hidden="true" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
