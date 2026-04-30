import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "よこぼのAIラボ",
  description: "AIで遊び、気づけば自分が変わっていた。画像生成、ゲーム制作、3D、AIツールの実験を気軽に残すラボです。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
