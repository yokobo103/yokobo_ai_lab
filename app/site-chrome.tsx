import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label="よこぼのAIラボ ホーム">
        <span className="brandLogo">
          <Image src="/design-reference/lp_logo.png" alt="よこぼのAIラボ" width={360} height={118} priority />
        </span>
      </Link>
      <nav>
        <Link href="/">ホーム</Link>
        <Link href="/#play">よこぼのあそび</Link>
        <Link href="/posts">研究ログ</Link>
        <Link href="/#researchers">キャラ紹介</Link>
        <Link href="/admin">Admin</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <Image className="footerRobot" src="/assets/cta/nyabbit-banner.png" alt="" width={260} height={245} />
      <div className="footerContent">
        <p className="footerTitle">一緒に、未来を研究しよう！</p>
        <p>完成してなくてOK。今日のあそびを、まず置いておく。</p>
        <div className="footerSignup">
          <span>ラボ通信を受け取る</span>
          <Image src="/assets/decor/paw-navy.svg" alt="" width={22} height={22} />
        </div>
      </div>
      <Image className="footerCat" src="/assets/cta/dr-yokobo-waving.png" alt="" width={300} height={300} />
    </footer>
  );
}
