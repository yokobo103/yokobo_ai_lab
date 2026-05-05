import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostCategories } from "@/lib/log-categories";
import { markdownToHtml } from "@/lib/markdown";
import { getAbsoluteUrl, getArticleDescription, getArticleOgpImage } from "@/lib/ogp";
import { getPost } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { SocialEmbedLoader } from "./social-embed-loader";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.status !== "public") return {};

  const title = post.title || "無題のあそび";
  const description = getArticleDescription(post);
  const url = getAbsoluteUrl(`/posts/${post.id}`);
  const image = getArticleOgpImage(post);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.status !== "public") notFound();

  return (
    <>
      <SiteHeader />
      <main className="articleShell">
        <Link className="backLink" href="/logs">← 研究ログ一覧へ</Link>
        <p className="eyebrow">{getPostCategories(post).join(" / ")}</p>
        <h1>{post.title || "無題のあそび"}</h1>
        <p className="articleSummary">{post.summary || "画像を置いたら、もう投稿。"}</p>
        {post.thumbnail ? (
          <div className="articleHero">
            <Image src={post.thumbnail} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" />
          </div>
        ) : null}
        {post.body ? (
          <>
            <article className="markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }} />
            <SocialEmbedLoader />
          </>
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
