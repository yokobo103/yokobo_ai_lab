import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { markdownToHtml } from "@/lib/markdown";
import { getPost } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.status !== "public") notFound();

  return (
    <>
      <SiteHeader />
      <main className="articleShell">
        <Link className="backLink" href="/posts">← 研究ログ一覧へ</Link>
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title || "無題のあそび"}</h1>
        <p className="articleSummary">{post.summary || "画像を置いたら、もう投稿。"}</p>
        <div className="tagRow">
          {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
        {post.thumbnail ? (
          <div className="articleHero">
            <Image src={post.thumbnail} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" />
          </div>
        ) : null}
        {post.body ? (
          <article className="markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }} />
        ) : null}
        {post.images.length > 0 ? (
          <section>
            <h2 className="smallHeading">ギャラリー</h2>
            <div className="galleryGrid">
              {post.images.map((image) => (
                <a href={image} key={image} target="_blank" rel="noreferrer">
                  <Image src={image} alt="" width={520} height={360} />
                </a>
              ))}
            </div>
          </section>
        ) : null}
        {post.links.length > 0 ? (
          <section>
            <h2 className="smallHeading">関連リンク</h2>
            <div className="linkList">
              {post.links.map((link) => (
                <a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label}</a>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
