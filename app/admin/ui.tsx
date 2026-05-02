"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";
import { categories, type Post } from "@/lib/schema";
import "./admin.css";

const STORAGE_KEY = "admin-password";

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
    tags: [],
    thumbnail: "",
    images: [],
    body: "",
    links: [],
    createdAt: now,
    updatedAt: now
  };
};

export default function AdminApp() {
  const [passwordInput, setPasswordInput] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(STORAGE_KEY) ?? ""
  );
  const [authPassword, setAuthPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [current, setCurrent] = useState<Post>(() => emptyPost());
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publicPath, setPublicPath] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const jsonHeaders = useMemo(
    () => ({
      "content-type": "application/json",
      "x-admin-password": authPassword,
      "ngrok-skip-browser-warning": "true"
    }),
    [authPassword]
  );

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
        setMessage("パスワードが違います。再ログインしてください");
        return;
      }

      const data = (await response.json()) as Post[];
      setPosts(data);
      setAuthed(true);
      setAuthPassword(pass);
      sessionStorage.setItem(STORAGE_KEY, pass);
      setMessage("ログインしました。");
    } catch {
      setMessage("ログインに失敗しました。ngrokのURLを開き直してから再試行してください。");
    }
  }

  function logout() {
    setAuthed(false);
    setAuthPassword("");
    setPosts([]);
    setCurrent(emptyPost());
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
      setMessage("パスワードが違います。再ログインしてください");
      return [];
    }
    const data = (await response.json()) as Post[];
    setPosts(data);
    return data;
  }

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setCurrent((post) => ({ ...post, [key]: value }));
  }

  function selectPost(post: Post) {
    setCurrent(post);
    setPublicPath(post.status === "public" ? `/posts/${post.id}` : "");
  }

  function linkText() {
    return current.links.map((link) => `${link.label},${link.url}`).join("\n");
  }

  function setLinkText(value: string) {
    update(
      "links",
      value
        .split("\n")
        .map((line) => {
          const [label, ...urlParts] = line.split(",");
          return { label: label?.trim() || "", url: urlParts.join(",").trim() };
        })
        .filter((link) => link.label && link.url)
    );
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
        setMessage("パスワードが違います。再ログインしてください");
      } else {
        setMessage(data.message || "保存できませんでした。");
      }
      return;
    }

    setCurrent(data);
    setPublicPath(status === "public" ? `/posts/${data.id}` : "");
    await reloadPosts();
    setMessage(status === "public" ? "公開しました。" : "下書き保存しました。");
  }

  async function deleteCurrentPost() {
    const exists = posts.some((post) => post.id === current.id);
    if (!exists) {
      setMessage("まだ保存されていない投稿です。");
      return;
    }

    const title = current.title || "無題のあそび";
    if (!window.confirm(`「${title}」を削除します。公開ページからも消えます。よろしいですか？`)) {
      return;
    }

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
        setMessage("パスワードが違います。再ログインしてください");
      } else {
        setMessage(data.message || "削除できませんでした。");
      }
      return;
    }

    const nextPosts = await reloadPosts();
    setCurrent(nextPosts[0] ?? emptyPost());
    setPublicPath(nextPosts[0]?.status === "public" ? `/posts/${nextPosts[0].id}` : "");
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
        setMessage("パスワードが違います。再ログインしてください");
      } else {
        setMessage(data.message || "アップロードできませんでした。");
      }
      return;
    }

    const images = data.images as string[];
    if (role === "thumbnail") update("thumbnail", images[0]);
    else update("images", [...current.images, ...images]);
    setMessage("画像を追加しました。保存ボタンで投稿に反映してください。");
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
          <h1>今日のあそびを置く</h1>
          <p>完成してなくてOK。ログイン後、写真を選んでひとこと添えたら保存できます。</p>
          <input
            type="password"
            placeholder="ADMIN_PASSWORD"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">ログイン</button>
          <p className="adminHint">ローカル開発で ADMIN_PASSWORD が未設定の場合のみ、`local-lab` を許可します。</p>
          {message ? <p className="adminMessage">{message}</p> : null}
        </form>
      </main>
    );
  }

  const toolbarItems = [
    ["見出し", "## 見出し"],
    ["小見出し", "### 小見出し"],
    ["太字", "**太字**"],
    ["箇条書き", "- 項目"],
    ["引用", "> 引用"],
    ["リンク", "[リンク名](https://example.com)"],
    ["区切り線", "---"]
  ] as const;

  return (
    <main className="adminPage">
      <header className="adminHero">
        <div>
          <p className="adminEyebrow">よこぼのAIラボ Admin</p>
          <h1>完成してなくてOK。今日のあそびを、まず置いておく。</h1>
          <p>スマホからでもOK。写真を選んで、ひとこと添えたら保存できます。</p>
        </div>
        <button className="logoutButton" type="button" onClick={logout}>ログアウト</button>
      </header>

      <div className="adminLayout">
        <aside className="postList">
          <button className="newButton" type="button" onClick={() => { setCurrent(emptyPost()); setPublicPath(""); }}>＋ 新しいあそび</button>
          {posts.map((post) => (
            <button className={post.id === current.id ? "active" : ""} key={post.id} type="button" onClick={() => selectPost(post)}>
              <span>{post.title || "無題のあそび"}</span>
              <small>{post.status === "public" ? "公開" : "下書き"} / {selectedCategories(post).join("・") || "未選択"}</small>
            </button>
          ))}
        </aside>

        <section className="editorPanel">
          <div className="fieldGrid">
            <label>ID<input value={current.id} onChange={(event) => update("id", event.target.value)} /></label>
            <div className="categorySummary">
              <span>カテゴリ</span>
              <strong>{selectedCategories().join(" / ") || "未選択（保存時に気づき・ログ）"}</strong>
            </div>
          </div>
          <p className="categoryHelp">カテゴリは0〜2個まで選べます。迷ったら未選択でも保存できます。</p>
          <div className="categoryPicker" aria-label="カテゴリを選択">
            {categories.map((category) => {
              const active = selectedCategories().includes(category);
              return (
                <button
                  className={active ? "active" : ""}
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <label>タイトル<input value={current.title} onChange={(event) => update("title", event.target.value)} placeholder="画像だけなら空でもOK" /></label>
          <label>ひとこと<textarea value={current.summary} onChange={(event) => update("summary", event.target.value)} rows={3} /></label>

          <div className="uploadBox">
            <div className="uploadHeader">
              <div>
                <strong>サムネ画像</strong>
                <p>現在のサムネがここに表示されます。アップロード後、「本文に挿入」もできます。</p>
              </div>
              <span className={current.thumbnail ? "statusPill ok" : "statusPill"}>{current.thumbnail ? "設定済み" : "未設定"}</span>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files, "thumbnail")} />
            {current.thumbnail ? (
              <div className="imagePreview currentThumb">
                <img src={current.thumbnail} alt="現在のサムネ画像" />
                <div>
                  <small>サムネ: {current.thumbnail}</small>
                  <button type="button" onClick={() => insertMarkdownImage(current.thumbnail)}>本文に挿入</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="uploadBox">
            <div className="uploadHeader">
              <div>
                <strong>ギャラリー画像</strong>
                <p>複数選択できます。各画像の「本文に挿入」でMarkdown欄へ追加できます。</p>
              </div>
              <span className={current.images.length ? "statusPill ok" : "statusPill"}>{current.images.length}枚</span>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => upload(event.target.files, "gallery")} />
            <div className="uploadedGrid">
              {current.images.map((image, index) => (
                <div className="imageTile" key={image}>
                  <span className="imageBadge">ギャラリー {index + 1}</span>
                  <img src={image} alt={`ギャラリー画像 ${index + 1}`} />
                  <small>{image}</small>
                  <button type="button" onClick={() => insertMarkdownImage(image)}>本文に挿入</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="markdownToolbar" aria-label="Markdownツールバー">
              {toolbarItems.map(([label, markdown]) => (
                <button key={label} type="button" onClick={() => insertAtCursor(markdown)}>{label}</button>
              ))}
            </div>
            <label>本文 Markdown<textarea ref={bodyRef} className="bodyInput" value={current.body} onChange={(event) => update("body", event.target.value)} rows={12} /></label>
          </div>

          <label>関連リンク（1行に「ラベル,URL」）<textarea value={linkText()} onChange={(event) => setLinkText(event.target.value)} rows={4} /></label>

          {preview ? (
            <div className="previewBox">
              <h2>{current.title || "無題のあそび"}</h2>
              <p>{current.summary}</p>
              {current.thumbnail ? <img src={current.thumbnail} alt="" /> : null}
              <pre>{current.body || "本文なし。画像だけでもOKです。"}</pre>
            </div>
          ) : null}

          {message ? <p className="adminMessage">{message}</p> : null}
          {publicPath ? <a className="publicLink" href={publicPath} target="_blank" rel="noreferrer">公開ページを開く</a> : null}
          <div className="actionBar">
            <button type="button" onClick={() => setPreview(!preview)}>プレビュー</button>
            <button type="button" disabled={saving} onClick={() => save("draft")}>Save Draft</button>
            <button className="publishButton" type="button" disabled={saving} onClick={() => save("public")}>Publish</button>
            <button className="deleteButton" type="button" disabled={saving || deleting} onClick={deleteCurrentPost}>
              削除
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
