import { Zen_Maru_Gothic } from "next/font/google";
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
