// LEGACY ROUTE: the current research article route is /read/[slug].
// Kept temporarily for direct-link compatibility; do not extend this page.

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorProfile } from "@/lib/authors";
import { getPostCategories } from "@/lib/log-categories";
import { markdownToHtml } from "@/lib/markdown";
import { getAbsoluteUrl, getArticleDescription, getArticleOgpImage } from "@/lib/ogp";
import { formatPostDate, getPost, getPostDateValue } from "@/lib/posts";
import { getResultStatus } from "@/lib/result-statuses";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { PawReaction } from "./paw-reaction";
import { SocialEmbedLoader } from "./social-embed-loader";

export const dynamic = "force-dynamic";

function stripLegacyPostMeta(body: string) {
  return body
    .replace(/^\s*担当[：:][^\n\r]*(?:\r?\n|$)/, "")
    .replace(/^\s*実験結果[：:][^\n\r]*(?:\r?\n|$)/, "")
    .replace(/^\s*-{3,}\s*(?:\r?\n|$)/, "")
    .trimStart();
}

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
  const dateValue = getPostDateValue(post);
  const formattedDate = formatPostDate(dateValue);
  const authorProfile = getAuthorProfile(post.author);
  const experimentResult = post.experimentResult || "実験結果メモは編集中です。";
  const resultStatus = getResultStatus(post.resultStatus);
  const body = stripLegacyPostMeta(post.body);

  return (
    <>
      <SiteHeader />
      <main className="articleShell">
        <Link className="backLink" href="/logs">← 研究ログ一覧へ</Link>
        <p className="eyebrow">{getPostCategories(post).join(" / ")}</p>
        <h1>{post.title || "無題のあそび"}</h1>
        {formattedDate ? <time className="articleMeta" dateTime={dateValue}>{formattedDate}</time> : null}
        <p className="articleSummary">{post.summary || "画像を置いたら、もう投稿。"}</p>
        {post.thumbnail ? (
          <div className="articleHero">
            <Image src={post.thumbnail} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" />
          </div>
        ) : null}
        <section className="articleAuthor" aria-labelledby="article-author-heading">
          <div className="articleHudLabel" aria-hidden="true">
            <span>RESPONSIBLE</span>
            <span>担当研究員</span>
          </div>
          <div className="articleAuthorImage">
            <Image src={authorProfile.image} alt="" width={144} height={144} />
          </div>
          <div className="articleAuthorBody">
            <h2 id="article-author-heading">この記事の担当</h2>
            <p className="articleAuthorName">{authorProfile.name}</p>
            <p className="articleAuthorTitle">{authorProfile.title}</p>
            <p>{authorProfile.description}</p>
          </div>
        </section>
        <section className="articleExperiment" aria-labelledby="article-experiment-heading">
          <div className="articleHudLabel" aria-hidden="true">
            <span>RESULT</span>
            <span>実験結果</span>
          </div>
          <div className="articleExperimentPanel">
            <Image className="articleResultBadge" src={resultStatus.image} alt={resultStatus.label} width={360} height={102} />
            <div className="articleExperimentText">
              <h2 id="article-experiment-heading">実験結果</h2>
              <p>{experimentResult}</p>
            </div>
          </div>
        </section>
        {body ? (
          <>
            <article className="markdown" dangerouslySetInnerHTML={{ __html: markdownToHtml(body) }} />
            <SocialEmbedLoader />
          </>
        ) : null}
        <PawReaction postId={post.id} />
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
