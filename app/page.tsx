import { Footer } from "./_redesign/components/Footer";
import { Header } from "./_redesign/components/Header";
import { HeroSection } from "./_redesign/components/HeroSection";
import { TeaserSection } from "./_redesign/components/TeaserSection";

export default function Home() {
  return (
    <div className="top-page">
      <Header variant="light" />
      <main>
        <HeroSection />
        <TeaserSection />
      </main>
      <Footer />
    </div>
  );
}
