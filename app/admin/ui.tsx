"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";
import { categories, type Post } from "@/lib/schema";
import "./admin.css";

const STORAGE_KEY = "admin-password";
type AdminView = "home" | "logs" | "editor" | "settings";
type StatusFilter = "all" | "draft" | "public";
type SortKey = "updated" | "created" | "title";
type EditorTab = "edit" | "preview" | "history";

const emptyPost = (): Post => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    summary: "",
    category: "気づき・ログ",
    categories: [],
    status: "draft",
    pinned: false,
    tags: [],
    thumbnail: "",
    images: [],
    body: "",
    links: [],
    createdAt: now,
    updatedAt: now
  };
};

function postTitle(post: Post) {
  return post.title || "無題のあそび";
}

function postSummary(post: Post) {
  return post.summary || post.body.split("\n").find(Boolean) || "ひとこと未入力";
}

function postCategories(post: Post) {
  return post.categories?.length ? post.categories : [post.category].filter(Boolean);
}

function formatDate(value: string) {
  if (!value) return "未保存";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const time = Date.parse(value);
  if (!time) return "未保存";
  const diff = Date.now() - time;
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return formatDate(value);
}

function splitTags(value: string) {
  return [...new Set(value.split(/[,\s　#]+/).map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
}

function formatLinkText(post: Post) {
  return post.links.map((link) => `${link.label},${link.url}`).join("\n");
}

function parseLinkText(value: string) {
  return value
    .split("\n")
    .map((line) => {
      const [label, ...urlParts] = line.split(",");
      return { label: label?.trim() || "", url: urlParts.join(",").trim() };
    })
    .filter((link) => link.label && link.url);
}

export default function AdminApp() {
  const [passwordInput, setPasswordInput] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(STORAGE_KEY) ?? ""
  );
  const [authPassword, setAuthPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [current, setCurrent] = useState<Post>(() => emptyPost());
  const [linkDraft, setLinkDraft] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publicPath, setPublicPath] = useState("");
  const [view, setView] = useState<AdminView>("home");
  const [editorTab, setEditorTab] = useState<EditorTab>("edit");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const jsonHeaders = useMemo(
    () => ({
      "content-type": "application/json",
      "x-admin-password": authPassword,
      "ngrok-skip-browser-warning": "true"
    }),
    [authPassword]
  );

  const stats = useMemo(() => {
    const drafts = posts.filter((post) => post.status === "draft");
    const publicPosts = posts.filter((post) => post.status === "public");
    const pinned = posts.filter((post) => post.pinned);
    return { drafts, publicPosts, pinned };
  }, [posts]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((post) => post.tags?.forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja-JP"));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts
      .filter((post) => {
        const haystack = [post.title, post.summary, post.body, post.id, ...(post.tags ?? [])].join(" ").toLowerCase();
        const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
        const matchesStatus = statusFilter === "all" || post.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || postCategories(post).includes(categoryFilter as Post["category"]);
        const matchesTag = tagFilter === "all" || post.tags?.includes(tagFilter);
        const matchesPinned = !pinnedOnly || post.pinned;
        return matchesQuery && matchesStatus && matchesCategory && matchesTag && matchesPinned;
      })
      .sort((a, b) => {
        if (sortKey === "title") return postTitle(a).localeCompare(postTitle(b), "ja-JP");
        const key = sortKey === "created" ? "createdAt" : "updatedAt";
        return Date.parse(b[key]) - Date.parse(a[key]);
      });
  }, [categoryFilter, pinnedOnly, posts, query, sortKey, statusFilter, tagFilter]);

  const recentPosts = useMemo(() => [...posts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5), [posts]);
  const recentDrafts = useMemo(() => stats.drafts.slice(0, 4), [stats.drafts]);
  const currentExists = posts.some((post) => post.id === current.id);
  const tagText = current.tags?.map((tag) => `#${tag}`).join(" ") ?? "";

  async function login() {
    const pass = passwordInput.trim();
    if (!pass) {
      setMessage("パスワードを入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        headers: { "x-admin-password": pass, "ngrok-skip-browser-warning": "true" }
      });
      if (!response.ok) {
        setAuthed(false);
        setAuthPassword("");
        sessionStorage.removeItem(STORAGE_KEY);
        setMessage("パスワードが違います。再ログインしてください。");
        return;
      }

      const data = (await response.json()) as Post[];
      setPosts(data);
      setAuthed(true);
      setAuthPassword(pass);
      sessionStorage.setItem(STORAGE_KEY, pass);
      const nextCurrent = data[0] ?? emptyPost();
      setCurrent(nextCurrent);
      setLinkDraft(formatLinkText(nextCurrent));
      setMessage("ログインしました。");
    } catch {
      setMessage("ログインに失敗しました。ngrok の URL を開き直してから再試行してください。");
    }
  }

  function logout() {
    setAuthed(false);
    setAuthPassword("");
    setPosts([]);
    const nextCurrent = emptyPost();
    setCurrent(nextCurrent);
    setLinkDraft(formatLinkText(nextCurrent));
    setPublicPath("");
    sessionStorage.removeItem(STORAGE_KEY);
    setMessage("ログアウトしました。");
  }

  async function reloadPosts(pass = authPassword) {
    const response = await fetch("/api/posts", {
      headers: { "x-admin-password": pass, "ngrok-skip-browser-warning": "true" }
    });
    if (!response.ok) {
      setAuthed(false);
      setAuthPassword("");
      sessionStorage.removeItem(STORAGE_KEY);
      setMessage("パスワードが違います。再ログインしてください。");
      return [];
    }
    const data = (await response.json()) as Post[];
    setPosts(data);
    return data;
  }

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setCurrent((post) => ({ ...post, [key]: value }));
  }

  function startNewPost() {
    const nextCurrent = emptyPost();
    setCurrent(nextCurrent);
    setLinkDraft(formatLinkText(nextCurrent));
    setPublicPath("");
    setEditorTab("edit");
    setView("editor");
  }

  function selectPost(post: Post) {
    setCurrent(post);
    setLinkDraft(formatLinkText(post));
    setPublicPath(post.status === "public" ? `/posts/${post.id}` : "");
    setEditorTab("edit");
    setView("editor");
  }

  function showDrafts() {
    setStatusFilter("draft");
    setPinnedOnly(false);
    setView("logs");
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setTagFilter("all");
    setPinnedOnly(false);
    setSortKey("updated");
  }

  function linkText() {
    return linkDraft;
  }

  function setLinkText(value: string) {
    setLinkDraft(value);
    update("links", parseLinkText(value));
  }

  function insertAtCursor(markdown: string) {
    const textarea = bodyRef.current;
    if (!textarea) {
      update("body", `${current.body}${current.body ? "\n\n" : ""}${markdown}`);
      return;
    }

    const start = textarea.selectionStart ?? current.body.length;
    const end = textarea.selectionEnd ?? current.body.length;
    const before = current.body.slice(0, start);
    const after = current.body.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n" : "";
    const nextBody = `${before}${prefix}${markdown}${suffix}${after}`;
    update("body", nextBody);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + prefix.length + markdown.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  function insertMarkdownImage(image: string) {
    insertAtCursor(`![画像](${image})`);
  }

  function selectedCategories(post = current) {
    return post.categories ?? [];
  }

  function toggleCategory(category: Post["category"]) {
    const selected = selectedCategories();
    const exists = selected.includes(category);
    const next = exists ? selected.filter((item) => item !== category) : [...selected, category];

    if (next.length > 2) {
      setMessage("カテゴリは2つまで選べます。");
      return;
    }

    setMessage("");
    setCurrent((post) => ({ ...post, category: next[0] ?? "気づき・ログ", categories: next }));
  }

  async function save(status: "draft" | "public") {
    setSaving(true);
    setMessage("");
    const payload = { ...current, status };
    const exists = posts.some((post) => post.id === payload.id);
    const response = await fetch(exists ? `/api/posts/${payload.id}` : "/api/posts", {
      method: exists ? "PUT" : "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        setAuthed(false);
        setAuthPassword("");
        sessionStorage.removeItem(STORAGE_KEY);
        setMessage("パスワードが違います。再ログインしてください。");
      } else {
        setMessage(data.message || "保存できませんでした。");
      }
      return;
    }

    setCurrent(data);
    setLinkDraft(formatLinkText(data));
    setPublicPath(status === "public" ? `/posts/${data.id}` : "");
    await reloadPosts();
    setMessage(status === "public" ? "公開しました。" : "下書きを保存しました。");
  }

  async function togglePinned(post = current) {
    const payload = { ...post, pinned: !post.pinned };
    const exists = posts.some((item) => item.id === payload.id);
    if (!exists) {
      update("pinned", payload.pinned);
      return;
    }
    const response = await fetch(`/api/posts/${payload.id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      setMessage("ピン留めを保存できませんでした。");
      return;
    }
    const data = (await response.json()) as Post;
    setCurrent((item) => (item.id === data.id ? data : item));
    await reloadPosts();
  }

  async function deleteCurrentPost() {
    const exists = posts.some((post) => post.id === current.id);
    if (!exists) {
      setMessage("まだ保存されていない投稿です。");
      return;
    }

    const title = current.title || "無題のあそび";
    if (!window.confirm(`「${title}」を削除します。公開ページからも消えます。よろしいですか？`)) return;

    setDeleting(true);
    setMessage("");
    const response = await fetch(`/api/posts/${current.id}`, {
      method: "DELETE",
      headers: jsonHeaders
    });
    const data = await response.json();
    setDeleting(false);

    if (!response.ok) {
      if (response.status === 401) {
        setAuthed(false);
        setAuthPassword("");
        sessionStorage.removeItem(STORAGE_KEY);
        setMessage("パスワードが違います。再ログインしてください。");
      } else {
        setMessage(data.message || "削除できませんでした。");
      }
      return;
    }

    const nextPosts = await reloadPosts();
    const nextCurrent = nextPosts[0] ?? emptyPost();
    setCurrent(nextCurrent);
    setLinkDraft(formatLinkText(nextCurrent));
    setPublicPath(nextCurrent.status === "public" ? `/posts/${nextCurrent.id}` : "");
    setView("logs");
    setMessage("投稿を削除しました。");
  }

  async function upload(files: FileList | null, role: "thumbnail" | "gallery") {
    if (!files?.length) return;
    setMessage("画像をアップロード中です。");
    const form = new FormData();
    form.append("postId", current.id);
    form.append("role", role);
    Array.from(files).forEach((file) => form.append("files", file));
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "x-admin-password": authPassword, "ngrok-skip-browser-warning": "true" },
      body: form
    });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        setAuthed(false);
        setAuthPassword("");
        sessionStorage.removeItem(STORAGE_KEY);
        setMessage("パスワードが違います。再ログインしてください。");
      } else {
        setMessage(data.message || "アップロードできませんでした。HEIC/HEIF は JPG または PNG に変換してから選んでください。");
      }
      return;
    }

    const images = data.images as string[];
    if (role === "thumbnail") update("thumbnail", images[0]);
    else update("images", [...current.images, ...images]);
    setMessage("画像を追加しました。保存ボタンで投稿に反映してください。");
  }

  const toolbarItems = [
    ["H2", "## 見出し"],
    ["H3", "### 小見出し"],
    ["B", "**太字**"],
    ["List", "- 項目"],
    ["Quote", "> 引用"],
    ["Link", "[リンク名](https://example.com)"],
    ["Line", "---"]
  ] as const;

  function renderSearchControls(compact = false) {
    return (
      <div className={compact ? "adminSearch compact" : "adminSearch"}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="タイトル・本文・タグで検索" />
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} aria-label="並び替え">
          <option value="updated">更新日が新しい順</option>
          <option value="created">作成日が新しい順</option>
          <option value="title">タイトル順</option>
        </select>
        <button type="button" onClick={resetFilters}>クリア</button>
      </div>
    );
  }

  function renderFilterPills() {
    return (
      <div className="filterPills" aria-label="ステータスで絞り込み">
        {[
          ["all", "すべて"],
          ["draft", "下書き"],
          ["public", "公開済み"]
        ].map(([value, label]) => (
          <button
            className={statusFilter === value ? "active" : ""}
            key={value}
            type="button"
            onClick={() => {
              setStatusFilter(value as StatusFilter);
              setPinnedOnly(false);
            }}
          >
            {label}
          </button>
        ))}
        <button className={pinnedOnly ? "active" : ""} type="button" onClick={() => setPinnedOnly(!pinnedOnly)}>
          ピン留め
        </button>
      </div>
    );
  }

  function renderPostRow(post: Post, dense = false) {
    const active = post.id === current.id;
    return (
      <button key={post.id} className={active ? "logCard active" : "logCard"} type="button" onClick={() => selectPost(post)}>
        <span className={dense ? "logThumb dense" : "logThumb"}>
          {post.thumbnail ? <img src={post.thumbnail} alt="" /> : <span className="thumbFallback">AI</span>}
        </span>
        <span className="logText">
          <strong>{postTitle(post)}</strong>
          <small>{postSummary(post)}</small>
          <span className="metaRow">
            <span className={post.status === "public" ? "miniStatus public" : "miniStatus draft"}>{post.status === "public" ? "公開" : "下書き"}</span>
            <span>{postCategories(post).join(" / ") || "未分類"}</span>
            <span>更新: {formatRelative(post.updatedAt)}</span>
          </span>
          {post.tags?.length ? (
            <span className="tagLine">{post.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}</span>
          ) : null}
        </span>
        <span className={post.pinned ? "pinMark active" : "pinMark"}>{post.pinned ? "★" : "…"}</span>
      </button>
    );
  }

  function renderLogSections(limit?: number) {
    const pinned = filteredPosts.filter((post) => post.pinned);
    const recent = filteredPosts.filter((post) => !post.pinned);
    const all = limit ? filteredPosts.slice(0, limit) : filteredPosts;
    return (
      <div className="logSections">
        {pinned.length ? (
          <section>
            <h2>ピン留め ({pinned.length})</h2>
            <div className="logList">{pinned.slice(0, limit ?? pinned.length).map((post) => renderPostRow(post))}</div>
          </section>
        ) : null}
        <section>
          <h2>{limit ? "最近編集したログ" : "すべてのログ"} ({all.length})</h2>
          <div className="logList">
            {(limit ? recent.slice(0, limit) : all).map((post) => renderPostRow(post))}
            {!filteredPosts.length ? <p className="emptyState">条件に合うログがありません。</p> : null}
          </div>
        </section>
      </div>
    );
  }

  function renderEditor() {
    return (
      <section className="editorPanel">
        <div className="editorTop">
          <button className="backButton" type="button" onClick={() => setView("logs")}>戻る</button>
          <div>
            <span className={current.status === "public" ? "statusPill ok" : "statusPill"}>{current.status === "public" ? "公開済み" : "下書き"}</span>
            <h2>{postTitle(current)}</h2>
            <p>最終保存: {formatRelative(current.updatedAt)} / ID: {current.id}</p>
          </div>
          <button className={current.pinned ? "iconButton active" : "iconButton"} type="button" onClick={() => void togglePinned()}>
            ★
          </button>
        </div>

        <div className="editorActions top">
          <button type="button" disabled={saving} onClick={() => save("draft")}>下書き保存</button>
          <button className="publishButton" type="button" disabled={saving} onClick={() => save("public")}>公開する</button>
        </div>

        <div className="editorTabs">
          {[
            ["edit", "編集"],
            ["preview", "プレビュー"],
            ["history", "履歴"]
          ].map(([value, label]) => (
            <button className={editorTab === value ? "active" : ""} key={value} type="button" onClick={() => setEditorTab(value as EditorTab)}>
              {label}
            </button>
          ))}
        </div>

        {editorTab === "edit" ? (
          <div className="editorForm">
            <section className="formSection">
              <h3>基本情報</h3>
              <div className="fieldGrid">
                <label>ID<input value={current.id} onChange={(event) => update("id", event.target.value)} disabled={currentExists} /></label>
                <label>ステータス<select value={current.status} onChange={(event) => update("status", event.target.value as Post["status"])}>
                  <option value="draft">下書き</option>
                  <option value="public">公開済み</option>
                </select></label>
              </div>
              <label>タイトル<input value={current.title} onChange={(event) => update("title", event.target.value)} placeholder="画像だけなら空でもOK" /></label>
              <label>ひとこと<textarea value={current.summary} onChange={(event) => update("summary", event.target.value)} rows={3} /></label>
            </section>

            <section className="formSection">
              <h3>カテゴリとタグ</h3>
              <p className="fieldHelp">カテゴリは2つまで。タグはスペース区切りで入力できます。</p>
              <div className="categoryPicker" aria-label="カテゴリを選択">
                {categories.map((category) => {
                  const active = selectedCategories().includes(category);
                  return (
                    <button className={active ? "active" : ""} key={category} type="button" onClick={() => toggleCategory(category)}>
                      {category}
                    </button>
                  );
                })}
              </div>
              <label>タグ<input value={tagText} onChange={(event) => update("tags", splitTags(event.target.value))} placeholder="#スマホ #実験 #アイデア" /></label>
            </section>

            <section className="formSection imageSection">
              <h3>画像</h3>
              <div className="imagePanels">
                <div className="uploadBox">
                  <div className="uploadHeader">
                    <strong>サムネ画像</strong>
                    <span className={current.thumbnail ? "statusPill ok" : "statusPill"}>{current.thumbnail ? "設定済み" : "未設定"}</span>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files, "thumbnail")} />
                  {current.thumbnail ? (
                    <div className="imagePreview currentThumb">
                      <img src={current.thumbnail} alt="現在のサムネ画像" />
                      <button type="button" onClick={() => insertMarkdownImage(current.thumbnail)}>本文に挿入</button>
                    </div>
                  ) : null}
                </div>

                <div className="uploadBox">
                  <div className="uploadHeader">
                    <strong>ギャラリー画像</strong>
                    <span className={current.images.length ? "statusPill ok" : "statusPill"}>{current.images.length}枚</span>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => upload(event.target.files, "gallery")} />
                  <div className="uploadedGrid">
                    {current.images.map((image, index) => (
                      <div className="imageTile" key={image}>
                        <img src={image} alt={`ギャラリー画像 ${index + 1}`} />
                        <button type="button" onClick={() => insertMarkdownImage(image)}>挿入</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="formSection">
              <h3>本文 Markdown</h3>
              <div className="markdownToolbar" aria-label="Markdown ツールバー">
                {toolbarItems.map(([label, markdown]) => (
                  <button key={label} type="button" onClick={() => insertAtCursor(markdown)}>{label}</button>
                ))}
              </div>
              <textarea ref={bodyRef} className="bodyInput" value={current.body} onChange={(event) => update("body", event.target.value)} rows={12} />
            </section>

            <section className="formSection">
              <h3>関連リンク</h3>
              <textarea value={linkText()} onChange={(event) => setLinkText(event.target.value)} rows={4} placeholder="ラベル,https://example.com" />
            </section>
          </div>
        ) : null}

        {editorTab === "preview" ? (
          <div className="previewBox">
            <h2>{postTitle(current)}</h2>
            <p>{current.summary}</p>
            {current.thumbnail ? <img src={current.thumbnail} alt="" /> : null}
            <pre>{current.body || "本文なし。画像だけの投稿もOKです。"}</pre>
          </div>
        ) : null}

        {editorTab === "history" ? (
          <div className="historyBox">
            <p>作成日: {formatDate(current.createdAt)}</p>
            <p>更新日: {formatDate(current.updatedAt)}</p>
            <p>公開ページ: {publicPath || "未公開"}</p>
          </div>
        ) : null}

        {message ? <p className="adminMessage">{message}</p> : null}
        {publicPath ? <a className="publicLink" href={publicPath} target="_blank" rel="noreferrer">公開ページを開く</a> : null}

        <div className="editorActions bottom">
          <button type="button" disabled={saving} onClick={() => save("draft")}>下書き保存</button>
          <button className="publishButton" type="button" disabled={saving} onClick={() => save("public")}>公開する</button>
          <button className="deleteButton" type="button" disabled={saving || deleting} onClick={deleteCurrentPost}>削除する</button>
        </div>
      </section>
    );
  }

  if (!authed) {
    return (
      <main className="adminGate">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void login();
          }}
        >
          <p className="adminEyebrow">よこぼのAIラボ Admin</p>
          <h1>今日のあそびを、まず置いておく。</h1>
          <p>完成してなくてもOK。スマホから写真を選んで、ひとこと添えるだけで保存できます。</p>
          <input
            type="password"
            placeholder="ADMIN_PASSWORD"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">ログイン</button>
          <p className="adminHint">ローカル開発で ADMIN_PASSWORD が未設定の場合のみ `local-lab` を許可します。</p>
          {message ? <p className="adminMessage">{message}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className={`adminPage view-${view}`}>
      <header className="mobileAdminHeader">
        <div>
          <p className="adminEyebrow">よこぼのAIラボ Admin</p>
          <h1>{view === "editor" ? "編集" : view === "logs" ? "ログ一覧" : view === "settings" ? "設定" : "完成してなくてOK。"}</h1>
        </div>
        <button className="iconButton" type="button" onClick={logout}>退出</button>
      </header>

      <div className="adminShell">
        <aside className="adminSidebar">
          <p className="adminBrand">よこぼのAIラボ Admin</p>
          <button className="primaryButton" type="button" onClick={startNewPost}>＋ 新しく書く</button>
          <button className="secondaryButton" type="button" onClick={showDrafts}>下書きを続ける（{stats.drafts.length}件）</button>
          <nav>
            <button className={view === "home" ? "active" : ""} type="button" onClick={() => setView("home")}>ホーム</button>
            <button className={view === "logs" ? "active" : ""} type="button" onClick={() => setView("logs")}>ログ一覧</button>
            <button type="button" onClick={showDrafts}>下書き <span>{stats.drafts.length}</span></button>
            <button type="button" onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setTagFilter("all"); setPinnedOnly(true); setView("logs"); }}>ピン留め <span>{stats.pinned.length}</span></button>
          </nav>
          <div className="sideFilters">
            <h2>フィルタ</h2>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">すべてのカテゴリ</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">すべてのタグ</option>
              {tagCounts.map(([tag]) => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">すべて</option>
              <option value="draft">下書き</option>
              <option value="public">公開済み</option>
            </select>
            <button type="button" onClick={resetFilters}>フィルタをクリア</button>
          </div>
          <div className="tagCloud">
            <h2>よく使うタグ</h2>
            {tagCounts.slice(0, 10).map(([tag]) => (
              <button key={tag} type="button" onClick={() => { setTagFilter(tag); setView("logs"); }}>#{tag}</button>
            ))}
          </div>
        </aside>

        <section className="adminHome">
          <div className="homeHero">
            <p className="adminEyebrow">今日の入口</p>
            <h1>完成してなくてOK。今日のあそびを、まず置いておく。</h1>
            <p>新規投稿、下書きの続き、最近編集したログにすぐ戻れます。</p>
            <button className="primaryButton" type="button" onClick={startNewPost}>新しく書く</button>
            <button className="secondaryButton" type="button" onClick={showDrafts}>下書きを続ける（{stats.drafts.length}件）</button>
          </div>

          <section className="mobileOnly">
            <h2>最近編集した</h2>
            <div className="logList compact">{recentPosts.slice(0, 3).map((post) => renderPostRow(post, true))}</div>
          </section>

          <section className="mobileOnly">
            <h2>下書き ({stats.drafts.length})</h2>
            <div className="draftStack">{recentDrafts.map((post) => renderPostRow(post, true))}</div>
          </section>

          <section className="mobileOnly">
            <h2>クイックフィルタ</h2>
            <div className="quickGrid">
              <button type="button" onClick={() => { resetFilters(); setView("logs"); }}>すべて</button>
              <button type="button" onClick={showDrafts}>下書き</button>
              <button type="button" onClick={() => { setStatusFilter("public"); setView("logs"); }}>公開済み</button>
              <button type="button" onClick={() => { setStatusFilter("all"); setPinnedOnly(true); setView("logs"); }}>ピン留め</button>
            </div>
          </section>

          <section className="mobileOnly">
            <h2>最近使ったタグ</h2>
            <div className="tagCloud inline">
              {tagCounts.slice(0, 8).map(([tag]) => <button key={tag} type="button" onClick={() => { setTagFilter(tag); setView("logs"); }}>#{tag}</button>)}
            </div>
          </section>
        </section>

        <section className="adminLogColumn">
          <div className="listHeader">
            <div>
              <h1>ログ一覧</h1>
              <p>全 {posts.length} 件 / 下書き {stats.drafts.length} 件 / 公開 {stats.publicPosts.length} 件</p>
            </div>
            <button className="mobileFilterButton" type="button" onClick={resetFilters}>絞り込み解除</button>
          </div>
          {renderSearchControls()}
          {renderFilterPills()}
          <div className="mobileSelectFilters">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">すべてのカテゴリ</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">すべてのタグ</option>
              {tagCounts.map(([tag]) => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
          </div>
          {renderLogSections()}
        </section>

        <div className="adminEditorColumn">
          {renderEditor()}
        </div>

        <section className="adminSettings">
          <h1>設定</h1>
          <p>現在はローカル JSON / GitHub-backed storage で投稿を保存します。画像は投稿 ID ごとに `/public/uploads/` へ保存されます。</p>
          <div className="settingsStats">
            <span>全ログ: {posts.length}</span>
            <span>下書き: {stats.drafts.length}</span>
            <span>公開済み: {stats.publicPosts.length}</span>
            <span>ピン留め: {stats.pinned.length}</span>
          </div>
          <button className="secondaryButton" type="button" onClick={logout}>ログアウト</button>
        </section>
      </div>

      <nav className="bottomNav" aria-label="admin mobile navigation">
        <button className={view === "home" ? "active" : ""} type="button" onClick={() => setView("home")}>ホーム</button>
        <button className={view === "logs" ? "active" : ""} type="button" onClick={() => setView("logs")}>ログ一覧</button>
        <button className={view === "editor" ? "active" : ""} type="button" onClick={startNewPost}>書く</button>
        <button className={view === "settings" ? "active" : ""} type="button" onClick={() => setView("settings")}>設定</button>
      </nav>
    </main>
  );
}
