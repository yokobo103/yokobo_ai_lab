function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function safeUrl(value: string) {
  const url = value.trim();
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

function xPostEmbedUrl(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "x.com" && host !== "twitter.com") return "";

    const match = parsed.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/.*)?$/);
    if (!match) return "";

    return `https://x.com/${match[1]}/status/${match[2]}`;
  } catch {
    return "";
  }
}

function youtubeEmbed(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    let isShort = false;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") ?? "";
      } else {
        const match = parsed.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
        videoId = match?.[2] ?? "";
        isShort = match?.[1] === "shorts";
      }
    }

    if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return null;

    return {
      src: `https://www.youtube-nocookie.com/embed/${videoId}`,
      isShort,
    };
  } catch {
    return null;
  }
}

const AUDIO_EXTENSION = /\.(ogg|oga|mp3|wav|m4a|aac|flac)$/i;

function audioEmbedHtml(value: string, label: string) {
  const safe = safeUrl(value);
  if (!safe) return "";
  if (!AUDIO_EXTENSION.test(safe.split(/[?#]/)[0])) return "";

  const caption = label.trim() ? `<figcaption>${escapeHtml(label.trim())}</figcaption>` : "";
  return [
    '<figure class="archive-embed archive-embed--audio">',
    `<audio controls preload="metadata" src="${escapeAttribute(safe)}"></audio>`,
    caption,
    "</figure>",
  ].join("");
}

const VIDEO_EXTENSION = /\.(mp4|webm|mov)$/i;

function videoEmbedHtml(value: string, label: string) {
  const safe = safeUrl(value);
  if (!safe) return "";
  if (!VIDEO_EXTENSION.test(safe.split(/[?#]/)[0])) return "";

  const caption = label.trim() ? `<figcaption>${escapeHtml(label.trim())}</figcaption>` : "";
  return [
    '<figure class="archive-embed archive-embed--video">',
    // playsinline が無いと iOS が勝手に全画面へ切り替える。autoplay と muted は付けない。
    `<video controls playsinline preload="metadata" src="${escapeAttribute(safe)}"></video>`,
    caption,
    "</figure>",
  ].join("");
}

function embeddedMediaHtml(line: string) {
  const url = line.trim();
  if (url !== line) return "";

  // 単独行の `[ラベル](音声・動画ファイル)` は、キャプション付きプレーヤーにする。
  const labelled = url.match(/^\[([^\]]*)\]\(([^)\s]+)\)$/);
  if (labelled) return audioEmbedHtml(labelled[2], labelled[1]) || videoEmbedHtml(labelled[2], labelled[1]);

  // 単独行の音声・動画ファイルは、ラベルなしのプレーヤーにする（/uploads/... のような相対パスも可）。
  if (url.startsWith("/") || /^https?:\/\/\S+$/.test(url)) {
    const audio = audioEmbedHtml(url, "");
    if (audio) return audio;
    const video = videoEmbedHtml(url, "");
    if (video) return video;
  }

  if (!/^https?:\/\/\S+$/.test(url)) return "";

  const xUrl = xPostEmbedUrl(url);
  if (xUrl) {
    const safeXUrl = escapeAttribute(xUrl);
    return [
      '<div class="archive-embed archive-embed--x">',
      '<blockquote class="twitter-tweet" data-dnt="true">',
      `<a href="${safeXUrl}" target="_blank" rel="noreferrer">Xで投稿を見る</a>`,
      "</blockquote>",
      "</div>",
    ].join("");
  }

  const youtube = youtubeEmbed(url);
  if (youtube) {
    const orientationClass = youtube.isShort ? " archive-embed--short" : "";
    return [
      `<div class="archive-embed archive-embed--youtube${orientationClass}">`,
      `<iframe src="${escapeAttribute(youtube.src)}" title="YouTube動画プレーヤー" loading="lazy" `,
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ',
      'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
      "</div>",
    ].join("");
  }

  return "";
}

function splitTrailingPunctuation(value: string) {
  const match = value.match(/^(.*?)([.,;:、。！？；：）］】」』]+)?$/);
  return {
    url: match?.[1] ?? value,
    trailing: match?.[2] ?? "",
  };
}

function autoLinkUrls(value: string) {
  return value.replace(/(^|[\s(（])((?:https?:\/\/|www\.)[^\s<]+)/g, (match, prefix: string, rawUrl: string) => {
    const { url, trailing } = splitTrailingPunctuation(rawUrl);
    const href = safeUrl(url.startsWith("www.") ? `https://${url}` : url);
    if (!href) return match;

    return `${prefix}<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${url}</a>${trailing}`;
  });
}

function inlineMarkdown(value: string) {
  const protectedHtml: string[] = [];
  const protect = (html: string) => {
    const key = `@@INLINE_${protectedHtml.length}@@`;
    protectedHtml.push(html);
    return key;
  };

  const prepared = value
    .replace(/`([^`]+)`/g, (_, code: string) => protect(`<code>${escapeHtml(code)}</code>`))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match: string, alt: string, src: string) => {
      const safeSrc = safeUrl(src);
      return safeSrc ? protect(`<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt)}" loading="lazy" />`) : match;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match: string, label: string, href: string) => {
      const safeHref = safeUrl(href);
      return safeHref
        ? protect(`<a href="${escapeAttribute(safeHref)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
        : match;
    })
    .replace(/\*\*([^*]+)\*\*/g, (_, text: string) => protect(`<strong>${escapeHtml(text)}</strong>`));

  const html = autoLinkUrls(escapeHtml(prepared));

  return protectedHtml.reduce((html, protectedValue, index) => {
    return html.replace(`@@INLINE_${index}@@`, protectedValue);
  }, html);
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.trim().split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  let inQuote = false;
  let inCodeBlock = false;
  let inNote = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let noteLines: string[] = [];

  const closeList = () => {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  };

  const closeQuote = () => {
    if (!inQuote) return;
    html.push("</blockquote>");
    inQuote = false;
  };

  const closeNote = () => {
    if (!inNote) return;
    html.push(`<aside class="archive-note">${markdownToHtml(noteLines.join("\n"))}</aside>`);
    inNote = false;
    noteLines = [];
  };

  for (const line of lines) {
    if (inNote) {
      if (line.trim() === ":::") {
        closeNote();
      } else {
        noteLines.push(line);
      }
      continue;
    }

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const languageClass = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
        html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCodeBlock = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        closeList();
        closeQuote();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim().split(/\s+/)[0] ?? "";
      }
      continue;
    }

    if (line.trim() === ":::note") {
      closeList();
      closeQuote();
      inNote = true;
      noteLines = [];
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      closeQuote();
      continue;
    }

    if (line.startsWith("> ")) {
      closeList();
      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }
      html.push(`<p>${inlineMarkdown(line.slice(2))}</p>`);
      continue;
    }

    closeQuote();

    const embeddedMedia = embeddedMediaHtml(line);
    if (embeddedMedia) {
      closeList();
      html.push(embeddedMedia);
    } else if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(2))}</h2>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  closeQuote();
  closeNote();

  if (inCodeBlock) {
    const languageClass = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return html.join("");
}
