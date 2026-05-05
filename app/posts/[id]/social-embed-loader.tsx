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
    window.twttr?.widgets?.load();
  }, []);

  return <Script async src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" onLoad={() => window.twttr?.widgets?.load()} />;
}
