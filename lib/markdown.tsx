function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function noteMarkdown(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${inlineMarkdown(line)}</p>`)
    .join("");
}

function parseUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function tweetEmbed(value: string) {
  const url = parseUrl(value);
  if (!url) return null;

  const hostname = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIndex = parts.indexOf("status");
  if (!["twitter.com", "x.com"].includes(hostname) || statusIndex < 1 || !parts[statusIndex + 1]) return null;

  url.hostname = "twitter.com";
  return `<blockquote class="twitter-tweet"><p><a href="${escapeAttribute(url.toString())}" target="_blank" rel="noreferrer">Xの投稿を表示</a></p></blockquote>`;
}

function youtubeEmbed(value: string) {
  const url = parseUrl(value);
  if (!url) return null;

  const hostname = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id = "";

  if (hostname === "youtu.be") {
    id = parts[0] ?? "";
  } else if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(hostname)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
    else if (["shorts", "embed"].includes(parts[0] ?? "")) id = parts[1] ?? "";
  }

  if (!/^[\w-]{11}$/.test(id)) return null;

  return [
    '<div class="video-embed">',
    `<iframe src="https://www.youtube.com/embed/${escapeAttribute(id)}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
    "</div>"
  ].join("");
}

function mediaEmbed(value: string) {
  return tweetEmbed(value) ?? youtubeEmbed(value);
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let inNote = false;
  let noteLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const languageClass = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
        html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCodeBlock = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim().split(/\s+/)[0] ?? "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === ":::note") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      inNote = true;
      noteLines = [];
      continue;
    }

    if (inNote) {
      if (line.trim() === ":::") {
        html.push(`<div class="note-box">${noteMarkdown(noteLines)}</div>`);
        inNote = false;
        noteLines = [];
      } else {
        noteLines.push(line);
      }
      continue;
    }

    if (!line.trim()) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    const embed = mediaEmbed(line.trim());
    if (embed) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(embed);
    } else if (line.startsWith("### ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      if (inList) html.push("</ul>");
      inList = false;
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  if (inCodeBlock) {
    const languageClass = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  if (inNote) {
    html.push(`<div class="note-box">${noteMarkdown(noteLines)}</div>`);
  }
  return html.join("");
}
