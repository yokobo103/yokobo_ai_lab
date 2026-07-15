import type { Metadata } from "next";
import { Header } from "../_redesign/components/Header";
import { HistoryMuseumPage } from "../_redesign/components/HistoryMuseumPage";

export const metadata: Metadata = {
  title: "歴史資料館 | よこぼのAIラボ",
  description: "初代から現在まで、よこぼのAIラボの歴代サイトデザインをたどる歴史資料館。",
};

export default function HistoryPage() {
  return <><Header variant="dark" showNav /><HistoryMuseumPage /></>;
}
