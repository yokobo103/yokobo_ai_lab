import Image from "next/image";
import Link from "next/link";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

const concernCards = [
  ["AIって難しそう…", "自分には関係ないかも", "/assets/concerns/icon-lightbulb.svg"],
  ["やってみたいけど、", "何から始めればいいかわからない", "/assets/concerns/icon-scribble.svg"],
  ["面白いことを", "作ってみたい！", "/assets/concerns/icon-star.svg"],
  ["自分のアイデアを", "形にできたら楽しそう", "/assets/concerns/icon-cat-face.svg"],
  ["AIで新しい自分に", "出会ってみたい", "/assets/concerns/icon-heart.svg"]
];

const playCards = [
  ["画像生成であそぶ", "アイデアを絵にしてキャラクターや世界を生み出します。", "/assets/play/play-image-generation.webp", "/assets/play/icons/icon-image.svg"],
  ["3Dであそぶ", "Blenderや3Dツールでキャラや背景を立体で作ります。", "/assets/play/play-3d.webp", "/assets/play/icons/icon-cube.svg"],
  ["ゲームをつくる", "UnityやWebで小さなゲーム案を試して、自作していきます。", "/assets/play/play-game.webp", "/assets/play/icons/icon-gamepad.svg"],
  ["AIを試してみる", "新しいAIツールやサービスを使って、可能性を探ります。", "/assets/play/play-ai-tool.webp", "/assets/play/icons/icon-flask.svg"],
  ["実験をシェアする", "うまくいったことも、失敗したことも、ぜんぶ研究データ！", "/assets/play/play-experiment-share.webp", "/assets/play/icons/icon-share.svg"],
  ["失敗して笑う", "失敗は最高のネタ。笑いながら次につなげます。", "/assets/play/play-failure.webp", "/assets/play/icons/icon-smile.svg"]
];

const logFallbacks = [
  "/assets/logs/thumb-future-lab.webp",
  "/assets/logs/thumb-3d-nyabbit.webp",
  "/assets/logs/thumb-rpg-game.webp",
  "/assets/logs/thumb-chatgpt-prompt.webp",
  "/assets/logs/thumb-comfyui-cat.webp"
];

const labValues = [
  ["研究", "/assets/vision/icon-research.svg"],
  ["創造", "/assets/vision/icon-creation.svg"],
  ["実験", "/assets/vision/icon-experiment.svg"],
  ["つながり", "/assets/vision/icon-connection.svg"],
  ["無限の可能性", "/assets/vision/icon-infinity.svg"]
];

export default async function Home() {
  const posts = (await readPosts()).filter((post) => post.status === "public").slice(0, 5);

  return (
    <div className="pageFrame">
      <SiteHeader />
      <main>
        <section className="hero section-shell">
          <div className="heroText">
            <p className="eyebrow">よこぼのAIラボ</p>
            <h1>
              AIで<span>遊び、</span>
              <br />
              気づけば
              <br />
              自分が変わっていた。
            </h1>
            <p className="heroLead">
              画像生成、ゲーム制作、3D、AIツールの実験まで。思いつきを形にしながら、
              毎日ワクワク研究中！このラボは、未来の自分に出会う場所です。
            </p>
            <div className="heroActions">
              <Link className="button primary" href="#play">
                よこぼのあそびを見る
                <Image src="/assets/decor/paw-white.svg" alt="" width={22} height={22} />
              </Link>
              <Link className="button secondary" href="#logs">
                最新の研究ログへ
                <Image src="/assets/decor/flask-button.svg" alt="" width={24} height={24} />
              </Link>
            </div>
          </div>

          <div className="heroVisual">
            <Image src="/design-reference/lp_top.png" alt="Dr.よこぼとニャビットのAIラボ" fill priority sizes="(max-width: 1100px) 100vw, 760px" />
          </div>
        </section>

        <section className="thoughts section-shell">
          <div className="sectionTitle compactTitle">
            <h2>
              こんな思い、ありませんか？
              <Image src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
            </h2>
          </div>
          <div className="thoughtGrid">
            {concernCards.map(([title, text, icon]) => (
              <article className="thoughtCard" key={title}>
                <Image src={icon} alt="" width={64} height={64} />
                <p>{title}<br />{text}</p>
              </article>
            ))}
          </div>
          <p className="supportCopy">
            <Image src="/assets/decor/yellow-rays-left.svg" alt="" width={58} height={58} />
            よこぼのAIラボは、そんなあなたの遊び心を応援します！
            <Image src="/assets/decor/yellow-rays-right.svg" alt="" width={58} height={58} />
          </p>
        </section>

        <section id="play" className="playSection section-shell">
          <div className="sectionTitle">
            <p className="eyebrow">今日のあそび</p>
            <h2>
              よこぼのあそび
              <Image src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
            </h2>
            <p>AIでいろんなことを試して、遊んで、作って、シェアしています！</p>
          </div>
          <div className="playGrid">
            {playCards.map(([title, text, image, icon]) => (
              <article className="playCard" key={title}>
                <div className="playThumb">
                  <Image src={image} alt="" fill sizes="(max-width: 720px) 100vw, 220px" />
                </div>
                <h3>
                  <Image src={icon} alt="" width={30} height={30} />
                  {title}
                </h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="centerAction">
            <Link className="button secondary compact" href="/posts">
              もっと見る
              <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
            </Link>
          </div>
        </section>

        <section id="logs" className="logsSection section-shell">
          <div className="sectionTitle">
            <h2>
              最新の研究ログ
              <Image src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
            </h2>
          </div>
          <div className="postGrid">
            {posts.map((post, index) => (
              <Link className="postCard" href={`/posts/${post.id}`} key={post.id}>
                <div className="postThumb">
                  <Image src={post.thumbnail || logFallbacks[index % logFallbacks.length]} alt="" fill sizes="(max-width: 720px) 100vw, 240px" />
                </div>
                <span className="chip">{post.category}</span>
                <h3>{post.title || "無題のあそび"}</h3>
                <p>{post.summary || "画像を置いたら、もう投稿。"}</p>
                <span className="readMore">詳しく見る →</span>
              </Link>
            ))}
          </div>
          <div className="centerAction">
            <Link className="button secondary compact" href="/posts">
              研究ログ一覧へ
              <Image src="/assets/decor/flask-button.svg" alt="" width={24} height={24} />
            </Link>
          </div>
        </section>

        <section id="researchers" className="researchLab section-shell">
          <article className="researcherPanel">
            <div className="researchCopy">
              <p className="eyebrow">ラボの研究員たち</p>
              <h2>Dr.よこぼ</h2>
              <p>AIラボ所長。好奇心旺盛で、なんでも試したい研究員。</p>
            </div>
            <Image className="panelCharacter" src="/assets/characters/dr-yokobo-profile.png" alt="Dr.よこぼ" width={310} height={380} />
            <div className="researchCopy">
              <h2>ニャビット</h2>
              <p>ラボサポートAI。相棒ロボットとして、今日のあそびを見つけます。</p>
            </div>
            <Image className="panelRobot" src="/assets/characters/nyabbit-profile.png" alt="ニャビット" width={260} height={310} />
          </article>

          <article className="visionPanel">
            <Image className="visionAtom" src="/assets/decor/atom-corner.svg" alt="" width={88} height={88} />
            <p className="eyebrow">よこぼのAIラボのビジョン</p>
            <h2>やさしいAIで、未来をもっと面白くする。</h2>
            <div className="valueRow">
              {labValues.map(([value, icon]) => (
                <span key={value}>
                  <Image src={icon} alt="" width={30} height={30} />
                  {value}
                </span>
              ))}
            </div>
            <p>AIを通じて、ひとりひとりの「やってみたい！」を応援し、ワクワクする未来を一緒に作っていきます。</p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
