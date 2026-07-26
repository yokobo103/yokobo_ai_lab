import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/ogp";
import PromoRoom from "./ui";

export const metadata: Metadata = {
  title: "宣伝室 | よこぼのAIラボ",
  robots: { index: false, follow: false },
};

export default function PromoPage() {
  // 共有する文章にはローカルのURLではなく本番のURLを載せる。
  return <PromoRoom siteUrl={getSiteUrl()} />;
}
