import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleAnalytics, GoogleAnalyticsScripts } from "./google-analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "よこぼのAIラボ",
  description: "AIと遊び、気づけば自分が変わっていた。画像生成、ゲーム制作、3D、AIツールの実験を気軽に残すラボです。",
  verification: {
    google: "iWUdScaP42kiN-NXU9D-BezDyX3k7MCbVT85Zuws0uM",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const shouldEnableAnalytics = process.env.NODE_ENV === "production" && gaMeasurementId;

  return (
    <html lang="ja">
      {shouldEnableAnalytics ? (
        <head>
          <GoogleAnalyticsScripts measurementId={gaMeasurementId} />
        </head>
      ) : null}
      <body>
        {children}
        {shouldEnableAnalytics ? (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={gaMeasurementId} />
          </Suspense>
        ) : null}
      </body>
    </html>
  );
}
