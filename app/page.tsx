import Image from "next/image";
import Link from "next/link";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

const playCards = [
  ["画像生成であそぶ", "アイデアを絵にして、キャラクターや世界観を育てます。", "/design-reference/character_design_sheet.png"],
  ["3Dであそぶ", "BlenderやWeb 3Dの試作を、途中のまま研究ログに残します。", "/design-reference/character_reference.png"],
  ["ゲームをつくる", "小さなルール、ステージ案、プロトタイプを気軽に試します。", "/design-reference/lp_reference.png"],
  ["AIを試してみる", "新しいAIツールやプロンプトを、まず触って観察します。", "/design-reference/logo-reference.png"],
  ["失敗して笑う", "うまくいかなかった結果も、次の発見の素材にします。", "/design-reference/character_reference.png"]
];

const experiences = [
  "AI画像でアイデアを形にする",
  "キャラや世界観を育てる",
  "ゲーム制作を気軽に試す",
  "新しいAIツールを実験する",
  "失敗ごと共有して学ぶ"
];

export default async function Home() {
  const posts = (await readPosts()).filter((post) => post.status === "public").slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero section-shell">
          <div className="heroText">
            <p className="eyebrow">よこぼのあそび研究所</p>
            <h1>よこぼのAIラボ</h1>
            <p className="heroCopy">AIで遊び、気づけば自分が変わっていた。</p>
            <p className="heroLead">
              画像生成、ゲーム制作、3D、AIツールの実験まで。思いつきを形にしながら、
              未来の自分を更新する場所です。
            </p>
            <div className="heroActions">
              <Link className="button primary" href="#play">よこぼのあそびを見る</Link>
              <Link className="button secondary" href="#logs">最新の研究ログへ</Link>
            </div>
          </div>
          <div className="heroImage">
            <Image src="/design-reference/lp_reference.png" alt="猫博士と小型ロボのAIラボ" fill priority />
          </div>
        </section>

        <section id="play" className="section-shell">
          <div className="sectionTitle">
            <p className="eyebrow">今日のあそび</p>
            <h2>よこぼのあそび</h2>
            <p>AIで作った画像、ゲーム案、3D実験、失敗ログ、気づきメモを気軽に置いていきます。</p>
          </div>
          <div className="playGrid">
            {playCards.map(([title, text, image]) => (
              <article className="playCard" key={title}>
                <div className="playThumb">
                  <Image src={image} alt="" fill sizes="(max-width: 720px) 100vw, 240px" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="softBand">
          <div className="section-shell">
            <div className="sectionTitle">
              <p className="eyebrow">完成してなくてOK</p>
              <h2>このラボで体験できること</h2>
            </div>
            <div className="experienceGrid">
              {experiences.map((item) => (
                <div className="experienceItem" key={item}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="logs" className="section-shell">
          <div className="sectionTitle rowTitle">
            <div>
              <p className="eyebrow">研究ログ</p>
              <h2>最新の研究ログ</h2>
            </div>
            <Link className="button secondary compact" href="/posts">研究ログ一覧へ</Link>
          </div>
          <div className="postGrid">
            {posts.map((post) => (
              <Link className="postCard" href={`/posts/${post.id}`} key={post.id}>
                <div className="postThumb">
                  {post.thumbnail ? <Image src={post.thumbnail} alt="" fill sizes="(max-width: 720px) 100vw, 280px" /> : null}
                </div>
                <span className="chip">{post.category}</span>
                <h3>{post.title || "無題のあそび"}</h3>
                <p>{post.summary || "画像を置いたら、もう投稿。"}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="section-shell researchers">
          <div className="sectionTitle">
            <p className="eyebrow">ラボの研究員たち</p>
            <h2>Dr.よこぼ と ニャビット</h2>
          </div>
          <div className="researcherGrid">
            <article>
              <Image src="/design-reference/character_reference.png" alt="Dr.よこぼ" width={360} height={360} />
              <h3>Dr.よこぼ</h3>
              <p>AIで遊びながら、気づきと失敗を集めるラボの研究員。</p>
            </article>
            <article>
              <Image src="/design-reference/logo-reference.png" alt="ニャビット" width={360} height={260} />
              <h3>ニャビット</h3>
              <p>今日のあそびを見つける、小型ロボの相棒。</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
