"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "ホーム", key: "home" },
  { href: "/logs", label: "発見ログ", key: "posts" },
  { href: "/experience", label: "体験格納庫", key: "experience" },
  { href: "/#themes", label: "遊びのテーマ", key: "themes" },
  { href: "/logs?category=ai-system", label: "ツール・素材", key: "tools" },
  { href: "/about", label: "よこぼについて", key: "about" }
];

const contactFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLScgKOrGgMR1S_TlSgRCCjsGQVZpK1PjqJvrX3E2ZdnpjqGC2w/viewform?usp=dialog";

export function SiteHeader({ active = "home" }: { active?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const mobileMenuPanelId = "site-mobile-menu-panel";

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className={`siteHeader${active === "experience" ? " siteHeader--experience" : ""}`}>
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
      <details className={`mobileMenu${isMobileMenuOpen ? " isOpen" : ""}`} data-state={isMobileMenuOpen ? "open" : "closed"} open={isMobileMenuOpen}>
        <summary
          className="mobileMenuButton"
          aria-controls={mobileMenuPanelId}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={(event) => {
            event.preventDefault();
            setIsMobileMenuOpen((open) => !open);
          }}
        >
          <span />
          <span />
          <span />
        </summary>
        {isMobileMenuOpen ? (
          <div className="mobileMenuPanel" id={mobileMenuPanelId}>
            {navLinks.map((link) => (
              <Link className={link.key === active ? "active" : undefined} href={link.href} key={link.label} onClick={closeMobileMenu}>
                {link.label}
              </Link>
            ))}
            <form className="mobileSearch" action="/logs" role="search" onSubmit={closeMobileMenu}>
              <input type="search" name="q" placeholder="サイト内検索" aria-label="サイト内検索" />
              <button type="submit">検索</button>
            </form>
          </div>
        ) : null}
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
        <Link href={contactFormUrl} target="_blank" rel="noreferrer">
          お問い合わせ・感想
        </Link>
      </nav>
      <Link className="footerContact" href={contactFormUrl} target="_blank" rel="noreferrer">
        お問い合わせ・感想
        <Image src="/assets/decor/paw-blue.svg" alt="" width={22} height={22} />
      </Link>
      <p>© YOKOBO AI LAB All Rights Reserved.</p>
      <Image className="footerPaw" src="/assets/decor/paw-blue.svg" alt="" width={28} height={28} />
    </footer>
  );
}
