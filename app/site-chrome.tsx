import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "ホーム" },
  { href: "/posts", label: "発見ログ" },
  { href: "/#themes", label: "遊びのテーマ" },
  { href: "/posts", label: "ツール・素材" },
  { href: "/#newsletter-heading", label: "よこぼについて" }
];

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/" aria-label="よこぼのAIラボ ホーム">
        <Image src="/design-reference/lp_logo.png" alt="よこぼのAIラボ" width={360} height={118} priority />
      </Link>
      <nav aria-label="メインナビゲーション">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.label}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link className="contactButton" href="/admin">
        お問い合わせ
        <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
      </Link>
      <details className="mobileMenu">
        <summary className="mobileMenuButton" aria-label="メニューを開く">
          <span />
          <span />
          <span />
        </summary>
        <div className="mobileMenuPanel">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin">お問い合わせ</Link>
        </div>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerBrand">
        <Image src="/design-reference/lp_logo.png" alt="よこぼのAIラボ" width={260} height={86} />
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
