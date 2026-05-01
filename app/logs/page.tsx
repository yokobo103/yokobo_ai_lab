import { PostListPage } from "../posts/post-list-page";

export const dynamic = "force-dynamic";

type LogsPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export default function LogsPage({ searchParams }: LogsPageProps) {
  return <PostListPage searchParams={searchParams} />;
}
