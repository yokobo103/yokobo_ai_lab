"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./promo.css";

// 宣伝室: サイト内のwebpを添えてXに投稿するための画面。
// スマホの共有メニュー経由で画像と文章を渡す（実機で確認済みの方式）。
// 設計は docs/2026-07-26_promo-room-plan.md を参照。

const STORAGE_KEY = "admin-password";
const LINK_IN_REPLY_KEY = "promo-link-in-reply";
const MAX_IMAGES = 4;
const TWEET_LIMIT = 280;

type Post = {
  id: string;
  title: string;
  summary?: string;
  status?: string;
  thumbnail?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type Experience = {
  title: string;
  summary?: string;
  thumbnail?: string;
  playUrl?: string;
  relatedPostId?: string;
  status?: string;
};

type PromoImage = { path: string; group: string; subgroup: string; tag?: string };

type Preset = {
  id: string;
  name: string;
  topic: string;
  postId: string;
  images: string[];
  text: string;
  savedAt: string;
};

type Topic = "site" | "latest" | "random" | "pick";

type Template = { label: string; text: string };

type Subject = {
  kind: "site" | "article" | "play";
  label: string;
  title: string;
  summary: string;
  url: string;
  pool: string[];
};

const TOPICS: { key: Topic; label: string; note: string }[] = [
  { key: "site", label: "サイト全体", note: "ラボそのものを宣伝する" },
  { key: "latest", label: "最新記事", note: "いちばん新しい記事" },
  { key: "random", label: "発掘", note: "過去の記事や遊べるものから1つ" },
  { key: "pick", label: "記事を選ぶ", note: "一覧から自分で選ぶ" },
];

// 候補に出す画像は data/promo-curation.json で選んである（tagが付いているものだけ）。
// フォルダ名から機械的に決めていた頃は、開発中のスクショや日付入りの古い素材が混ざっていた。
// 記事のサムネは記事を書くときによこぼが選んだ絵なので、選別なしでそのまま候補にできる。
const POST_THUMB_TAG = "post";

const IMAGE_TAGS: { key: string; label: string }[] = [
  { key: POST_THUMB_TAG, label: "記事のサムネ" },
  { key: "character", label: "キャラクター" },
  { key: "world", label: "ラボの世界" },
  { key: "play", label: "遊べるもの" },
  { key: "experiment", label: "実験の記録" },
  { key: "history", label: "歴代サイト" },
  { key: "sign", label: "看板" },
];

export default function PromoRoom({ siteUrl, initialPostId = "" }: { siteUrl: string; initialPostId?: string }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [gateMessage, setGateMessage] = useState("");
  const [booting, setBooting] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [promoImages, setPromoImages] = useState<PromoImage[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  const [topic, setTopic] = useState<Topic>("site");
  const [imageTag, setImageTag] = useState("all");
  const [pickedPostId, setPickedPostId] = useState("");
  const [discovered, setDiscovered] = useState<Subject | null>(null);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [filesReady, setFilesReady] = useState(true);

  const [templateIndex, setTemplateIndex] = useState(0);
  const [text, setText] = useState("");
  // 本文にリンクを入れると初速のリーチが落ちると言われているので、既定ではリプに回す。
  const [linkInReply, setLinkInReply] = useState(true);
  const [sharedOnce, setSharedOnce] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "ok" | "error">("info");
  const [rawFallback, setRawFallback] = useState("");

  const notify = useCallback((tone: "info" | "ok" | "error", body: string) => {
    setMessageTone(tone);
    setMessage(body);
  }, []);

  const loadAll = useCallback(async (password: string) => {
    const headers = { "x-admin-password": password, "ngrok-skip-browser-warning": "true" };
    const [postsResponse, experiencesResponse, imagesResponse, presetsResponse] = await Promise.all([
      fetch("/api/posts", { headers }),
      fetch("/api/experiences", { headers }),
      fetch("/promo-images.json"),
      fetch("/api/promo-presets", { headers }),
    ]);

    if (postsResponse.status === 401 || experiencesResponse.status === 401) {
      throw new Error("unauthorized");
    }

    const loadedPosts: Post[] = postsResponse.ok ? await postsResponse.json() : [];
    const loadedExperiences: Experience[] = experiencesResponse.ok ? await experiencesResponse.json() : [];
    const loadedImages = imagesResponse.ok ? await imagesResponse.json() : { images: [] };

    setPosts(loadedPosts.filter((post) => post.status === "public" && post.id));
    setExperiences(loadedExperiences.filter((item) => item.status === "live" && item.playUrl));
    setPromoImages(Array.isArray(loadedImages.images) ? loadedImages.images : []);
    setPresets(presetsResponse.ok ? await presetsResponse.json() : []);
    if (!presetsResponse.ok) {
      // プリセットが読めなくても宣伝はできるので、止めずに知らせるだけにする。
      notify("error", "保存済みのプリセットを読み込めませんでした。新しく保存するのは避けてください。");
    }
  }, [notify]);

  const signIn = useCallback(
    async (password: string, fromStorage: boolean) => {
      const trimmed = password.trim();
      if (!trimmed) {
        setGateMessage("パスワードを入れてください。");
        return false;
      }

      try {
        await loadAll(trimmed);
      } catch (error) {
        if (error instanceof Error && error.message === "unauthorized") {
          // パスワード自体が違うときだけ保存を消す。通信の失敗で消すと、
          // 電波が一瞬切れただけで入力し直しになってしまう。
          setGateMessage(fromStorage ? "保存されたパスワードが使えませんでした。" : "パスワードが違います。");
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          setGateMessage("読み込みに失敗しました。通信を確認して、もう一度お試しください。");
        }
        return false;
      }

      window.localStorage.setItem(STORAGE_KEY, trimmed);
      setAuthPassword(trimmed);
      setAuthed(true);
      setGateMessage("");
      return true;
    },
    [loadAll]
  );

  // 管理画面と同じパスワードを使い回すので、ログイン済みならそのまま入れる。
  useEffect(() => {
    setLinkInReply(window.localStorage.getItem(LINK_IN_REPLY_KEY) !== "off");

    const stored = window.localStorage.getItem(STORAGE_KEY) || "";
    if (!stored) {
      setBooting(false);
      return;
    }
    // 自動ログインに失敗しても入れ直さずに済むよう、入力欄には残しておく。
    setPasswordInput(stored);
    void signIn(stored, true).finally(() => setBooting(false));
  }, [signIn]);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => dateValue(b) - dateValue(a)),
    [posts]
  );

  // 管理画面から ?post=<記事ID> で来たときは、その記事を選んだ状態にしておく。
  // 記事が読み込まれるのはログインのあとなので、揃うのを待ってから1回だけ効かせる。
  useEffect(() => {
    if (!initialPostId || pickedPostId) return;
    if (!posts.some((post) => post.id === initialPostId)) return;
    setPickedPostId(initialPostId);
    setTopic("pick");
  }, [initialPostId, pickedPostId, posts]);

  // サイト全体の宣伝で選べる画像。選別ずみの共通素材に、公開記事のサムネを足す。
  const sitePromoImages = useMemo(() => {
    const curated = promoImages
      .filter((image) => image.tag)
      .map((image) => ({ path: image.path, tag: image.tag as string }));
    const thumbnails = sortedPosts
      .map((post) => post.thumbnail)
      .filter((path): path is string => Boolean(path))
      .map((path) => ({ path, tag: POST_THUMB_TAG }));

    const seen = new Set<string>();
    return [...curated, ...thumbnails].filter((image) => {
      if (seen.has(image.path)) return false;
      seen.add(image.path);
      return true;
    });
  }, [promoImages, sortedPosts]);

  const siteImagePool = useMemo(
    () =>
      sitePromoImages
        .filter((image) => imageTag === "all" || image.tag === imageTag)
        .map((image) => image.path),
    [sitePromoImages, imageTag]
  );

  const availableTags = useMemo(() => {
    const present = new Set(sitePromoImages.map((image) => image.tag));
    return IMAGE_TAGS.filter((tag) => present.has(tag.key));
  }, [sitePromoImages]);

  const subject = useMemo<Subject | null>(() => {
    if (topic === "site") {
      return {
        kind: "site",
        label: "サイト全体",
        title: "よこぼのAIラボ",
        summary: "AIと遊んだ記録を置いているラボ",
        url: siteUrl,
        pool: siteImagePool,
      };
    }

    if (topic === "latest") {
      const latest = sortedPosts[0];
      return latest ? postSubject(latest, siteUrl, "最新記事") : null;
    }

    if (topic === "pick") {
      const picked = sortedPosts.find((post) => post.id === pickedPostId);
      return picked ? postSubject(picked, siteUrl, "選んだ記事") : null;
    }

    return discovered;
  }, [topic, siteUrl, siteImagePool, sortedPosts, pickedPostId, discovered]);

  const templates = useMemo(() => (subject ? buildTemplates(subject, topic) : []), [subject, topic]);

  const rollCandidates = useCallback((pool: string[], keep: string[]) => {
    const rest = pool.filter((path) => !keep.includes(path));
    setCandidates(shuffle(rest).slice(0, MAX_IMAGES));
  }, []);

  // 宣伝する対象そのものが変わったときだけ、選び直しとして全部組み直す。
  // subjectはタグを切り替えるだけでも作り直されるので、中身の識別子で見る。
  const subjectKey = subject ? `${topic}:${subject.kind}:${subject.url}` : "";

  useEffect(() => {
    if (!subject) {
      setSelected([]);
      setText("");
      return;
    }
    setSelected([]);
    setTemplateIndex(0);
    setText(buildTemplates(subject, topic)[0]?.text || "");
    setRawFallback("");
    // subjectKeyが変わったときだけ走らせたいので、subject本体は依存に入れない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey]);

  // 候補の引き直し。読み込み完了・絞り込みの変更・ネタの変更のいずれでも走る。
  // 選んだ画像は消さないので、絞り込みをまたいで組み合わせられる。
  const poolKey = subject ? subject.pool.join("|") : "";

  useEffect(() => {
    if (!subject) {
      setCandidates([]);
      return;
    }
    rollCandidates(subject.pool, selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey, rollCandidates]);

  // 共有の直前に読み込むとiOSで弾かれることがあるので、選んだ時点でファイルにしておく。
  useEffect(() => {
    let cancelled = false;
    if (selected.length === 0) {
      setFiles([]);
      setFilesReady(true);
      return;
    }

    setFilesReady(false);
    (async () => {
      try {
        const prepared = await Promise.all(selected.map(toImageFile));
        if (cancelled) return;
        setFiles(prepared);
        setFilesReady(true);
      } catch {
        if (cancelled) return;
        setFiles([]);
        setFilesReady(true);
        notify("error", "画像の読み込みに失敗しました。別の画像を選んでください。");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, notify]);

  async function savePreset() {
    if (!subject || !text.trim()) return;
    const name = presetName.trim() || subject.title;

    setSavingPreset(true);
    try {
      const response = await fetch("/api/promo-presets", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": authPassword },
        body: JSON.stringify({ name, topic, postId: topic === "pick" ? pickedPostId : "", images: selected, text }),
      });
      const body = await response.json();
      if (!response.ok) {
        notify("error", body.message || "保存できませんでした。");
        return;
      }
      setPresets(body);
      setPresetName("");
      notify("ok", `「${name}」を保存しました。`);
    } catch {
      notify("error", "保存できませんでした。通信を確認してください。");
    } finally {
      setSavingPreset(false);
    }
  }

  function loadPreset(preset: Preset) {
    setTopic(preset.topic as Topic);
    if (preset.postId) setPickedPostId(preset.postId);
    // ネタを戻すと組み直しの処理が走るので、そのあとに保存内容を上書きする。
    window.setTimeout(() => {
      setSelected(preset.images);
      setText(preset.text);
      setTemplateIndex(-1);
    }, 0);
    notify("ok", `「${preset.name}」を読み込みました。`);
  }

  async function deletePreset(preset: Preset) {
    try {
      const response = await fetch("/api/promo-presets", {
        method: "DELETE",
        headers: { "content-type": "application/json", "x-admin-password": authPassword },
        body: JSON.stringify({ id: preset.id }),
      });
      if (!response.ok) {
        notify("error", "消せませんでした。");
        return;
      }
      setPresets(await response.json());
      notify("info", `「${preset.name}」を消しました。`);
    } catch {
      notify("error", "消せませんでした。通信を確認してください。");
    }
  }

  function discover() {
    const candidatesForDiscovery: Subject[] = [
      ...sortedPosts.map((post) => postSubject(post, siteUrl, "発掘した記事")),
      ...experiences.map((item) => playSubject(item, siteUrl, posts)),
    ];
    const next = pickRandom(candidatesForDiscovery);
    if (next) setDiscovered(next);
  }

  function selectTopic(next: Topic) {
    setTopic(next);
    setMessage("");
    if (next === "random") discover();
    if (next === "pick" && !pickedPostId && sortedPosts[0]) setPickedPostId(sortedPosts[0].id);
  }

  function toggleImage(path: string) {
    setSelected((prev) => {
      if (prev.includes(path)) return prev.filter((item) => item !== path);
      if (prev.length >= MAX_IMAGES) {
        notify("info", `画像は${MAX_IMAGES}枚までです。`);
        return prev;
      }
      return [...prev, path];
    });
  }

  function applyTemplate(index: number) {
    setTemplateIndex(index);
    setText(templates[index]?.text || "");
  }

  // リプに回すときは本文にURLを入れない。投稿後に②でコピーして自分の投稿へ返信する。
  const shareBody = subject && !linkInReply ? `${text.trim()}\n\n${subject.url}` : text.trim();
  const used = tweetWeight(shareBody);

  function toggleLinkInReply(next: boolean) {
    setLinkInReply(next);
    setSharedOnce(false);
    window.localStorage.setItem(LINK_IN_REPLY_KEY, next ? "on" : "off");
  }

  async function copyLink() {
    if (!subject) return;
    try {
      await navigator.clipboard.writeText(subject.url);
      notify("ok", "リンクをコピーしました。さっきの投稿に返信して貼り付けてください。");
    } catch {
      setRawFallback(subject.url);
      notify("info", "自動コピーできませんでした。下の枠のリンクを手でコピーしてください。");
    }
  }

  async function share() {
    if (!subject) return;
    setRawFallback("");

    const payload: ShareData = { text: shareBody };
    if (files.length > 0) payload.files = files;

    const canUseShare =
      typeof navigator.share === "function" &&
      (files.length === 0 || typeof navigator.canShare !== "function" || navigator.canShare(payload));

    if (!canUseShare) {
      await fallbackShare();
      return;
    }

    try {
      await navigator.share(payload);
      setSharedOnce(true);
      notify(
        "ok",
        linkInReply
          ? "共有メニューを開きました。投稿したら、下の②でリンクを貼りに戻ってきてください。"
          : "共有メニューを開きました。Xを選んで投稿してください。"
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        notify("info", "共有をやめました。");
        return;
      }
      await fallbackShare();
    }
  }

  async function fallbackShare() {
    try {
      await navigator.clipboard.writeText(shareBody);
      notify("ok", "この端末では共有メニューが使えないので、文章をコピーして画像を保存しました。");
    } catch {
      setRawFallback(shareBody);
      notify("info", "文章は下の枠から手でコピーしてください。画像は保存します。");
    }

    for (const path of selected) {
      const link = document.createElement("a");
      link.href = path;
      link.download = path.split("/").pop() || "image.webp";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  if (booting) {
    return (
      <main className="promoPage">
        <div className="promoShell">
          <p className="promoLead">読み込み中…</p>
        </div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="promoPage">
        <div className="promoGate">
          <p className="promoEyebrow">PROMO ROOM</p>
          <h1 className="promoTitle">宣伝室</h1>
          <p className="promoLead">管理画面と同じパスワードで入れます。</p>
          <input
            type="password"
            placeholder="ADMIN_PASSWORD"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void signIn(passwordInput, false);
            }}
          />
          <button type="button" className="promoShareButton" onClick={() => void signIn(passwordInput, false)}>
            入る
          </button>
          {gateMessage ? (
            <p className="promoMessage" data-tone="error">
              {gateMessage}
            </p>
          ) : null}
          <a className="promoBackLink" href="/admin">
            ← 管理画面へ
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="promoPage">
      <div className="promoShell">
        <header className="promoHeader">
          <p className="promoEyebrow">PROMO ROOM</p>
          <h1 className="promoTitle">宣伝室</h1>
          <p className="promoLead">
            ネタと画像と文章を選んで、最後に共有ボタン。Xアプリに画像つきで渡ります。投稿ボタンを押すのは自分で。
          </p>
          <a className="promoBackLink" href="/admin">
            ← 管理画面へ
          </a>
        </header>

        {presets.length > 0 ? (
          <section className="promoStep">
            <div className="promoStepHead">
              <span className="promoStepNo">保存ずみ</span>
              <h2 className="promoStepTitle">プリセット</h2>
            </div>
            <div className="promoPresetList">
              {presets.map((preset) => (
                <div key={preset.id} className="promoPresetRow">
                  <button type="button" className="promoPresetLoad" onClick={() => loadPreset(preset)}>
                    <span className="promoPresetName">{preset.name}</span>
                    <span className="promoPresetNote">
                      {preset.images.length > 0 ? `画像${preset.images.length}枚・` : ""}
                      {preset.text.replace(/\s+/g, " ").slice(0, 24)}…
                    </span>
                  </button>
                  <button
                    type="button"
                    className="promoPresetDelete"
                    aria-label={`${preset.name}を消す`}
                    onClick={() => void deletePreset(preset)}
                  >
                    消す
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">STEP 1</span>
            <h2 className="promoStepTitle">何を宣伝する？</h2>
          </div>
          <div className="promoChoices">
            {TOPICS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="promoChoice"
                aria-pressed={topic === item.key}
                onClick={() => selectTopic(item.key)}
              >
                <span className="promoChoiceLabel">{item.label}</span>
                <span className="promoChoiceNote">{item.note}</span>
              </button>
            ))}
          </div>

          {topic === "pick" ? (
            <select
              className="promoSelect"
              value={pickedPostId}
              onChange={(event) => setPickedPostId(event.target.value)}
            >
              {sortedPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          ) : null}

          {topic === "random" ? (
            <div className="promoRowActions">
              <button type="button" className="promoGhostButton" onClick={discover}>
                別のを掘る
              </button>
            </div>
          ) : null}

          {subject ? (
            <div className="promoSubject">
              <span className="promoSubjectLabel">{subject.label}</span>
              <span className="promoSubjectTitle">{subject.title}</span>
              <span className="promoSubjectUrl">{subject.url}</span>
            </div>
          ) : (
            <p className="promoStepNote">宣伝できるものが見つかりませんでした。</p>
          )}
        </section>

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">STEP 2</span>
            <h2 className="promoStepTitle">画像を選ぶ</h2>
          </div>
          <p className="promoStepNote">
            候補から選んでください（{MAX_IMAGES}枚まで、なしでも投稿できます）。ピンとこなければ引き直せます。
          </p>

          {topic === "site" && availableTags.length > 0 ? (
            <div className="promoTagRow">
              <button
                type="button"
                className="promoTag"
                aria-pressed={imageTag === "all"}
                onClick={() => setImageTag("all")}
              >
                すべて
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag.key}
                  type="button"
                  className="promoTag"
                  aria-pressed={imageTag === tag.key}
                  onClick={() => setImageTag(tag.key)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          ) : null}

          {selected.length > 0 ? (
            <div className="promoSelected">
              {selected.map((path) => (
                <button key={path} type="button" className="promoSelectedItem" onClick={() => toggleImage(path)}>
                  <img src={path} alt="選んだ画像" />
                  <span className="promoSelectedRemove">外す</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="promoCandidates">
            {candidates.map((path) => (
              <button
                key={path}
                type="button"
                className="promoCandidate"
                aria-pressed={selected.includes(path)}
                onClick={() => toggleImage(path)}
              >
                <img src={path} alt="画像の候補" loading="lazy" />
              </button>
            ))}
          </div>

          <div className="promoRowActions">
            <button
              type="button"
              className="promoGhostButton"
              disabled={!subject || subject.pool.length <= MAX_IMAGES}
              onClick={() => subject && rollCandidates(subject.pool, selected)}
            >
              別の候補を見る
            </button>
            <button
              type="button"
              className="promoGhostButton"
              disabled={selected.length === 0}
              onClick={() => setSelected([])}
            >
              選択を消す
            </button>
          </div>
        </section>

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">STEP 3</span>
            <h2 className="promoStepTitle">文章を決める</h2>
          </div>
          <p className="promoStepNote">
            1行目で結果を言う「フック」と、意見を求めて終わる「質問」が伸びやすいと言われています。
            そのまま使っても、直してもかまいません。
          </p>
          <div className="promoTemplates">
            {templates.map((template, index) => (
              <button
                key={template.text}
                type="button"
                className="promoTemplate"
                aria-pressed={templateIndex === index && text === template.text}
                onClick={() => applyTemplate(index)}
              >
                <span className="promoTemplateLabel">{template.label}</span>
                {template.text}
              </button>
            ))}
          </div>
          <textarea
            className="promoTextarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="ここを直せば自由に書けます"
          />
          <p className="promoCount" data-over={used > TWEET_LIMIT}>
            {used} / {TWEET_LIMIT}
            {linkInReply ? "（リンクは含めず数えています）" : "（URLぶんを含む）"}
          </p>
        </section>

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">STEP 4</span>
            <h2 className="promoStepTitle">Xに渡す</h2>
          </div>
          <div className="promoTagRow">
            <button
              type="button"
              className="promoTag"
              aria-pressed={linkInReply}
              onClick={() => toggleLinkInReply(true)}
            >
              リンクはリプ欄に
            </button>
            <button
              type="button"
              className="promoTag"
              aria-pressed={!linkInReply}
              onClick={() => toggleLinkInReply(false)}
            >
              本文に入れる
            </button>
          </div>
          <p className="promoStepNote">
            {linkInReply
              ? "本文にリンクを入れると伸びにくいと言われているので、投稿してからリプで貼ります。①のあと②の順で。"
              : "本文の最後にリンクが入ります。1回で終わりますが、リーチは落ちるかもしれません。"}
          </p>

          <button
            type="button"
            className="promoShareButton"
            disabled={!subject || !text.trim() || !filesReady}
            onClick={() => void share()}
          >
            {!filesReady
              ? "画像を準備中…"
              : `${linkInReply ? "① " : ""}共有する${selected.length ? `（画像${selected.length}枚）` : ""}`}
          </button>

          {linkInReply ? (
            <button
              type="button"
              className={sharedOnce ? "promoShareButton" : "promoGhostButton promoWideButton"}
              disabled={!subject}
              onClick={() => void copyLink()}
            >
              ② リンクをコピー（リプに貼る用）
            </button>
          ) : null}
          {message ? (
            <p className="promoMessage" data-tone={messageTone}>
              {message}
            </p>
          ) : null}
          {rawFallback ? (
            <textarea
              className="promoTextarea"
              readOnly
              value={rawFallback}
              onFocus={(event) => event.currentTarget.select()}
            />
          ) : null}

          <p className="promoStepNote">
            気に入った組み合わせは保存しておくと、次からプリセットを押すだけで同じものが出せます。
          </p>
          <div className="promoSaveRow">
            <input
              className="promoNameInput"
              type="text"
              placeholder={subject ? `名前（既定: ${subject.title.slice(0, 12)}）` : "名前"}
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
            <button
              type="button"
              className="promoGhostButton"
              disabled={!subject || !text.trim() || savingPreset}
              onClick={() => void savePreset()}
            >
              {savingPreset ? "保存中…" : "保存"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function dateValue(post: Post) {
  return Date.parse(post.updatedAt || post.createdAt || "") || 0;
}

function postSubject(post: Post, siteUrl: string, label: string): Subject {
  const pool = [post.thumbnail, ...(post.images || [])].filter((path): path is string => Boolean(path));
  return {
    kind: "article",
    label,
    title: post.title,
    summary: truncate(post.summary || "", 70),
    url: `${siteUrl}/read/${post.id}`,
    pool: unique(pool),
  };
}

function playSubject(experience: Experience, siteUrl: string, posts: Post[]): Subject {
  const related = posts.find((post) => post.id === experience.relatedPostId && post.status === "public");
  const pool = [experience.thumbnail, related?.thumbnail, ...(related?.images || [])].filter(
    (path): path is string => Boolean(path)
  );
  return {
    kind: "play",
    label: "遊べるもの",
    title: experience.title,
    summary: truncate(experience.summary || "", 70),
    url: related ? `${siteUrl}/read/${related.id}` : `${siteUrl}/experiments`,
    pool: unique(pool),
  };
}

// 文章の型は3種類。上から順に伸びやすいと言われている順に並べる。
//   フック = 1行目で結果や意外性を言う（「【新記事】〜」のような告知型は素通りされやすい）
//   質問   = 返信を誘う締め。返信は「いいね」より重いシグナルとされる
//   報告   = 従来の告知型。落ち着いて出したいときのために残してある
// いずれも出典はマーケティング系の解説でX公式の仕様ではないので、型は選べるままにしてある。
function buildTemplates(subject: Subject, topic: Topic): Template[] {
  const { title, summary } = subject;
  const body = summary ? `\n\n${summary}` : "";

  if (subject.kind === "site") {
    return [
      {
        label: "フック",
        text: "非エンジニアがAIと遊び続けたら、ゲームも3Dも動画も置いてある場所ができました。\nうまくいかなかった実験も、そのまま残してあります。",
      },
      {
        label: "フック",
        text: "AIにどこまで任せられるのか、ひたすら試した記録が溜まってきました。\n成功も失敗も全部出しています。",
      },
      {
        label: "質問",
        text: "AIと遊んだ記録を置いているラボです。\n次は何を作らせたら面白いと思いますか？",
      },
      {
        label: "報告",
        text: "よこぼのAIラボ、今日も実験中です。\nAIと遊んだ記録を、うまくいかなかったぶんも含めて置いてあります。",
      },
      {
        label: "報告",
        text: "非エンジニアがAIと作ったゲーム・3D・動画を並べたラボです。\nのぞいていってもらえたら嬉しいです。",
      },
    ];
  }

  if (subject.kind === "play") {
    return [
      { label: "フック", text: `AIと一緒に作ったゲーム、ブラウザで遊べるところまで来ました。\n${title}` },
      { label: "フック", text: `インストール不要、開いたらすぐ遊べます。\n${title}${body}` },
      { label: "質問", text: `${title}\n遊べる形にはなったんですが、次に何を足すと面白くなりますか？` },
      { label: "報告", text: `${title}\nAIと一緒に作りました。よかったら遊んでみてください。` },
    ];
  }

  if (topic === "random") {
    return [
      { label: "フック", text: `昔の実験を掘り返したら、こんなものが出てきました。\n${title}${body}` },
      { label: "フック", text: `当時これで力尽きた実験です。今のAIならもっといけた気がします。\n${title}` },
      { label: "質問", text: `${title}\nここで止まったままなんですが、続きをやるなら何から手をつけますか？` },
      { label: "報告", text: `そういえば、こんな実験もしてました。\n${title}${body}` },
    ];
  }

  return [
    { label: "フック", text: `AIにやらせてみたら、こうなりました。\n${title}${body}` },
    { label: "フック", text: `${title}${body}\n\nうまくいったところも、詰まったところも全部書いています。` },
    { label: "質問", text: `${title}${body}\n\n同じことを試している人いますか？やり方の意見ももらえると嬉しいです。` },
    { label: "報告", text: `【新記事】${title}${body}` },
  ];
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function pickRandom<T>(values: T[]): T | null {
  if (values.length === 0) return null;
  return values[Math.floor(Math.random() * values.length)];
}

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function truncate(value: string, limit: number) {
  const trimmed = value.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

async function toImageFile(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`画像を読めませんでした: ${path}`);
  const blob = await response.blob();
  const name = path.split("/").pop() || "image.webp";
  return new File([blob], name, { type: blob.type || "image/webp" });
}

// Xの文字数の数え方に寄せる: 日本語などの全角は2、URLは長さに関係なく23。
const WIDE_CHARACTER =
  /[ᄀ-ᇿ⺀-꓏ꥠ-꥿가-퟿豈-﫿︐-︙︰-﹯＀-｠￠-￦]/;

function tweetWeight(text: string) {
  const urls = text.match(/https?:\/\/\S+/g) || [];
  const withoutUrls = text.replace(/https?:\/\/\S+/g, "");
  let weight = urls.length * 23;
  for (const character of withoutUrls) {
    weight += WIDE_CHARACTER.test(character) ? 2 : 1;
  }
  return weight;
}
