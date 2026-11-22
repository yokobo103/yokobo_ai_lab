import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import { defaultOgpImagePath, getAbsoluteUrl } from "@/lib/ogp";

export const metadata: Metadata = {
  title: "ラボ案内 | よこぼのAIラボ",
  description: "よこぼのAIラボの館内案内。ラボが生まれたきっかけ、きまり、扱っていることを紹介します。",
  openGraph: {
    title: "ラボ案内 | よこぼのAIラボ",
    description: "よこぼのAIラボの館内案内。ラボが生まれたきっかけ、きまり、扱っていることを紹介します。",
    url: getAbsoluteUrl("/about"),
    images: [
      {
        url: getAbsoluteUrl(defaultOgpImagePath),
        alt: "よこぼのAIラボ ラボ案内",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ラボ案内 | よこぼのAIラボ",
    description: "よこぼのAIラボの館内案内。ラボが生まれたきっかけ、きまり、扱っていることを紹介します。",
    images: [getAbsoluteUrl(defaultOgpImagePath)],
  },
};
import { AboutLabPage } from "../_redesign/components/AboutLabPage";
import { Header } from "../_redesign/components/Header";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export default function AboutPage() {
  return (
    <>
      <Header variant="dark" showNav />
      <div className={zenMaruGothic.className}>
        <AboutLabPage />
      </div>
    </>
  );
}
