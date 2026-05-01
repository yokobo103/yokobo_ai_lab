import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "ホーム", key: "home" },
  { href: "/logs", label: "発見ログ", key: "posts" },
  { href: "/#themes", label: "遊びのテーマ", key: "themes" },
  { href: "/logs?category=ai-system", label: "ツール・素材", key: "tools" },
  { href: "/about", label: "よこぼについて", key: "about" }
];

export function SiteHeader({ active = "home" }: { active?: string }) {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label="よこぼのAIラボ ホーム">
        <Image src="/assets/brand/lp-logo.webp" alt="よこぼのAIラボ" width={360} height={118} priority />
      </Link>
      <nav aria-label="メインナビゲーション">
        {navLinks.map((link) => (
          <Link className={link.key === active ? "active" : undefined} href={link.href} key={link.label}>
            {link.label}
          </Link>
        ))}
      </nav>
      <form className="siteSearch" action="/logs" role="search">
        <input type="search" name="q" placeholder="サイト内検索" aria-label="サイト内検索" />
        <button type="submit" aria-label="検索">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
        </button>
      </form>
      <details className="mobileMenu">
        <summary className="mobileMenuButton" aria-label="メニューを開閉">
          <span />
          <span />
          <span />
        </summary>
        <div className="mobileMenuPanel">
          {navLinks.map((link) => (
            <Link className={link.key === active ? "active" : undefined} href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
          <form className="mobileSearch" action="/logs" role="search">
            <input type="search" name="q" placeholder="サイト内検索" aria-label="サイト内検索" />
            <button type="submit">検索</button>
          </form>
        </div>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerBrand">
        <Image src="/assets/brand/lp-logo.webp" alt="よこぼのAIラボ" width={260} height={86} />
      </div>
      <nav aria-label="フッターナビゲーション">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.label}>
            {link.label}
          </Link>
        ))}
        <Link href="/admin">お問い合わせ</Link>
      </nav>
      <Link className="footerContact" href="/admin">
        お問い合わせ
        <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
      </Link>
      <p>© YOKOBO AI LAB All Rights Reserved.</p>
      <Image className="footerPaw" src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
    </footer>
  );
}
