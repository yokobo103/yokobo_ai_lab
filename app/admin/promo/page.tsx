import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/ogp";
import PromoRoom from "./ui";

export const metadata: Metadata = {
  title: "宣伝室 | よこぼのAIラボ",
  robots: { index: false, follow: false },
};

export default async function PromoPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  // ?post=<記事ID> つきで来たら、その記事を選んだ状態で開く（管理画面からの導線）。
  const { post } = await searchParams;
  // 共有する文章にはローカルのURLではなく本番のURLを載せる。
  return <PromoRoom siteUrl={getSiteUrl()} initialPostId={post || ""} />;
}
