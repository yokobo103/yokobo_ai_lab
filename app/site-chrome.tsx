import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/">
        <span className="brandIcon">△</span>
        <span>よこぼのAIラボ</span>
      </Link>
      <nav>
        <Link href="/#play">よこぼのあそび</Link>
        <Link href="/posts">研究ログ</Link>
        <Link href="/admin">Admin</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <p>よこぼのAIラボ</p>
      <p>完成してなくてOK。画像を置いたら、もう投稿。</p>
    </footer>
  );
}
