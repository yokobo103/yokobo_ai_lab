import type { Metadata } from "next";
import { Header } from "../_redesign/components/Header";
import { LabExperimentPage } from "../_redesign/components/LabExperimentPage";
import { defaultOgpImagePath, getAbsoluteUrl } from "@/lib/ogp";

export const metadata: Metadata = {
  title: "実験室 | よこぼのAIラボ",
  description: "ゲーム、3D、ツール、プロトタイプなど、よこぼのAIラボの実験を集めた実験室。",
  openGraph: {
    title: "実験室 | よこぼのAIラボ",
    description: "ゲーム、3D、ツール、プロトタイプなど、よこぼのAIラボの実験を集めた実験室。",
    url: getAbsoluteUrl("/experiments"),
    images: [
      {
        url: getAbsoluteUrl(defaultOgpImagePath),
        alt: "よこぼのAIラボ 実験室",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "実験室 | よこぼのAIラボ",
    description: "ゲーム、3D、ツール、プロトタイプなど、よこぼのAIラボの実験を集めた実験室。",
    images: [getAbsoluteUrl(defaultOgpImagePath)],
  },
};

export default function ExperimentsPage() {
  return (
    <>
      <Header variant="light" showNav />
      <LabExperimentPage />
    </>
  );
}
