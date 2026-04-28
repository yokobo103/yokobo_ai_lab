"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, type Post } from "@/lib/schema";
import "./admin.css";

const emptyPost = (): Post => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    summary: "",
    category: "メモ",
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
  const [password, setPassword] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem("admin-password") ?? ""
  );
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [current, setCurrent] = useState<Post>(() => emptyPost());
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicPath, setPublicPath] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const headers = useMemo(() => ({ "content-type": "application/json", "x-admin-password": password }), [password]);

  const loadPosts = useCallback(async (pass = password) => {
    const response = await fetch("/api/posts", { headers: { "x-admin-password": pass } });
    if (!response.ok) {
      setMessage("パスワードを確認してください。");
      return;
    }
    const data = (await response.json()) as Post[];
    setPosts(data);
    setAuthed(true);
    sessionStorage.setItem("admin-password", pass);
    setMessage("管理画面を開きました。");
  }, [password]);

  useEffect(() => {
    if (password) void loadPosts(password);
  }, [loadPosts, password]);

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setCurrent((post) => ({ ...post, [key]: value }));
  }

  function selectPost(post: Post) {
    setCurrent(post);
    setPublicPath(post.status === "public" ? `/posts/${post.id}` : "");
  }

  function tagText() {
    return current.tags.join(", ");
  }

  function setTagText(value: string) {
    update("tags", value.split(",").map((tag) => tag.trim()).filter(Boolean));
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

  async function save(status: "draft" | "public") {
    setSaving(true);
    setMessage("");
    const payload = { ...current, status };
    const exists = posts.some((post) => post.id === payload.id);
    const response = await fetch(exists ? `/api/posts/${payload.id}` : "/api/posts", {
      method: exists ? "PUT" : "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.message || "保存できませんでした。");
      return;
    }
    setCurrent(data);
    setPublicPath(status === "public" ? `/posts/${data.id}` : "");
    await loadPosts();
    setMessage(status === "public" ? "公開しました。" : "下書き保存しました。");
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
      headers: { "x-admin-password": password },
      body: form
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "アップロードできませんでした。");
      return;
    }
    const images = data.images as string[];
    if (role === "thumbnail") update("thumbnail", images[0]);
    else update("images", [...current.images, ...images]);
    setMessage("画像を追加しました。保存ボタンで投稿に反映してください。");
  }

  function insertMarkdownImage(image: string) {
    const markdown = `![画像](${image})`;
    const textarea = bodyRef.current;
    if (!textarea) {
      update("body", `${current.body}${current.body ? "\n\n" : ""}${markdown}`);
      return;
    }

    const start = textarea.selectionStart ?? current.body.length;
    const end = textarea.selectionEnd ?? current.body.length;
    const before = current.body.slice(0, start);
    const after = current.body.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    const nextBody = `${before}${prefix}${markdown}${suffix}${after}`;
    update("body", nextBody);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + prefix.length + markdown.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  if (!authed) {
    return (
      <main className="adminGate">
        <div>
          <p className="adminEyebrow">よこぼのAIラボ Admin</p>
          <h1>今日のあそびを置く</h1>
          <p>完成してなくてOK。今日のあそびを、まず置いておく。</p>
          <input type="password" placeholder="ADMIN_PASSWORD" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button onClick={() => loadPosts()} type="button">管理画面へ</button>
          {message ? <p className="adminMessage">{message}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <header className="adminHero">
        <p className="adminEyebrow">よこぼのAIラボ Admin</p>
        <h1>完成してなくてOK。今日のあそびを、まず置いておく。</h1>
        <p>スマホからでもOK。写真を選んで、ひとこと添えたら保存できます。</p>
      </header>

      <div className="adminLayout">
        <aside className="postList">
          <button className="newButton" type="button" onClick={() => { setCurrent(emptyPost()); setPublicPath(""); }}>＋ 新しいあそび</button>
          {posts.map((post) => (
            <button className={post.id === current.id ? "active" : ""} key={post.id} type="button" onClick={() => selectPost(post)}>
              <span>{post.title || "無題のあそび"}</span>
              <small>{post.status === "public" ? "公開" : "下書き"} / {post.category}</small>
            </button>
          ))}
        </aside>

        <section className="editorPanel">
          <div className="fieldGrid">
            <label>ID<input value={current.id} onChange={(event) => update("id", event.target.value)} /></label>
            <label>カテゴリ<select value={current.category} onChange={(event) => update("category", event.target.value as Post["category"])}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select></label>
          </div>
          <label>タイトル<input value={current.title} onChange={(event) => update("title", event.target.value)} placeholder="画像だけなら空でもOK" /></label>
          <label>ひとこと<textarea value={current.summary} onChange={(event) => update("summary", event.target.value)} rows={3} /></label>
          <label>タグ（カンマ区切り）<input value={tagText()} onChange={(event) => setTagText(event.target.value)} placeholder="画像生成, 今日のあそび" /></label>

          <div className="uploadBox">
            <div className="uploadHeader">
              <div>
                <strong>サムネ画像</strong>
                <p>現在のサムネがここに表示されます。iPhoneの写真ライブラリから選べます。</p>
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

          <label>本文 Markdown<textarea ref={bodyRef} className="bodyInput" value={current.body} onChange={(event) => update("body", event.target.value)} rows={12} /></label>
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
          </div>
        </section>
      </div>
    </main>
  );
}
