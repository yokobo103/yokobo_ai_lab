"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

export function SocialEmbedLoader() {
  useEffect(() => {
    const timers = [0, 300, 1000, 2500].map((delay) =>
      window.setTimeout(() => {
        window.twttr?.widgets?.load();
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <Script
      async
      src="https://platform.twitter.com/widgets.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.twttr?.widgets?.load();
      }}
    />
  );
}
