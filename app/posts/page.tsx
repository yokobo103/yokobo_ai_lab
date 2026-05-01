import { PostListPage } from "./post-list-page";

export const dynamic = "force-dynamic";

type PostsPageProps = {
  searchParams?: Promise<{ category?: string; q?: string }>;
};

export default function PostsPage({ searchParams }: PostsPageProps) {
  return <PostListPage searchParams={searchParams} />;
}
