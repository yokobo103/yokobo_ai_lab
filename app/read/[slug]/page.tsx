import { Header } from "../../_redesign/components/Header";
import { ArchiveArticlePage } from "../../_redesign/components/ArchiveArticlePage";

type ReadArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function ReadArticleRoute({ params }: ReadArticleRouteProps) {
  const { slug } = await params;

  return (
    <>
      <Header variant="dark" showNav />
      <ArchiveArticlePage slug={decodeURIComponent(slug)} />
    </>
  );
}
