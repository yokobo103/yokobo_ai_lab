"use client";

import { useCallback, useEffect, useRef } from "react";

type XWidgetsWindow = Window & {
  twttr?: {
    widgets?: {
      load: (element?: HTMLElement) => void;
    };
  };
};

const X_WIDGET_SCRIPT_URL = "https://platform.twitter.com/widgets.js";

type EmbeddedMarkdownProps = {
  html: string;
};

export function EmbeddedMarkdown({ html }: EmbeddedMarkdownProps) {
  const rootRef = useRef<HTMLElement>(null);
  const hasXEmbed = html.includes('class="twitter-tweet"');

  const renderXEmbeds = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    (window as XWidgetsWindow).twttr?.widgets?.load(root);
  }, []);

  useEffect(() => {
    if (hasXEmbed) renderXEmbeds();
  }, [hasXEmbed, html, renderXEmbeds]);

  return (
    <>
      <article ref={rootRef} className="archive-markdown" dangerouslySetInnerHTML={{ __html: html }} />
      {hasXEmbed ? (
        <script
          id="x-widgets-script"
          src={X_WIDGET_SCRIPT_URL}
          async
          charSet="utf-8"
          onLoad={renderXEmbeds}
        />
      ) : null}
    </>
  );
}
