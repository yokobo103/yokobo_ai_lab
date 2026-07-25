import type { Metadata } from "next";
import { Header } from "../../_redesign/components/Header";
import { ArchiveArticlePage } from "../../_redesign/components/ArchiveArticlePage";
import { getArchiveArticle } from "../../_redesign/data/archiveArticles";
import { defaultOgpImagePath, getAbsoluteUrl } from "@/lib/ogp";

type ReadArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ReadArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArchiveArticle(decodeURIComponent(slug));

  if (!article) {
    return {
      title: "記事が見つかりません | よこぼのAIラボ",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const title = article.title || "無題の研究記録";
  const description =
    article.summary || article.body.split("\n").find(Boolean)?.trim() || "よこぼのAIラボの研究記録です。";
  const url = getAbsoluteUrl(`/read/${article.id}`);
  const image = getAbsoluteUrl(article.thumbnail || defaultOgpImagePath);

  return {
    title: `${title} | よこぼのAIラボ`,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: article.publishedAt || article.createdAt || undefined,
      modifiedTime: article.updatedAt || undefined,
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

export default async function ReadArticleRoute({ params }: ReadArticleRouteProps) {
  const { slug } = await params;

  return (
    <>
      <Header variant="dark" showNav />
      <ArchiveArticlePage slug={decodeURIComponent(slug)} />
    </>
  );
}
