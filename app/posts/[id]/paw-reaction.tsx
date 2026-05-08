"use client";

import { useEffect, useMemo, useState } from "react";

type ReactionState = "idle" | "loading" | "submitting" | "voted" | "error";

type PawReactionProps = {
  postId: string;
};

export function PawReaction({ postId }: PawReactionProps) {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<ReactionState>("loading");
  const [error, setError] = useState("");
  const [justPawed, setJustPawed] = useState(false);
  const storageKey = useMemo(() => `paw:voted:${postId}`, [postId]);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      setError("");
      try {
        const response = await fetch(`/api/reactions?postId=${encodeURIComponent(postId)}`, {
          cache: "no-store"
        });
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { count?: number };
        if (!active) return;
        setCount(typeof data.count === "number" ? data.count : 0);
        setState(window.localStorage.getItem(storageKey) ? "voted" : "idle");
      } catch {
        if (!active) return;
        setError("少し時間をおいて再試行してください。");
        setState(window.localStorage.getItem(storageKey) ? "voted" : "error");
      }
    }

    loadCount();
    return () => {
      active = false;
    };
  }, [postId, storageKey]);

  async function handlePaw() {
    if (state === "submitting" || state === "loading" || state === "voted") return;

    if (window.localStorage.getItem(storageKey)) {
      setState("voted");
      return;
    }

    setState("submitting");
    setError("");

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ postId })
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { count?: number };
      setCount(typeof data.count === "number" ? data.count : count + 1);
      window.localStorage.setItem(storageKey, "1");
      setState("voted");
      setJustPawed(true);
      window.setTimeout(() => setJustPawed(false), 420);
    } catch {
      setError("少し時間をおいて再試行してください。");
      setState("error");
    }
  }

  const disabled = state === "loading" || state === "submitting" || state === "voted";
  const buttonLabel = state === "voted" ? "🐾 応援済み" : "🐾 ぽちっと応援";

  return (
    <section className="pawReaction" aria-label="肉球リアクション">
      <div className="pawReactionInner">
        <p className="pawReactionLead">読んだしるしに、そっと肉球を置いていけます。</p>
        <div className="pawReactionControls">
          <button
            className={`pawReactionButton${justPawed ? " pawed" : ""}`}
            type="button"
            onClick={handlePaw}
            disabled={disabled}
            aria-pressed={state === "voted"}
          >
            <span>{buttonLabel}</span>
          </button>
          <span className="pawReactionCount" aria-live="polite">
            {count.toLocaleString("ja-JP")} 肉球
          </span>
        </div>
        {error ? <p className="pawReactionError">{error}</p> : null}
      </div>
    </section>
  );
}
