"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./promo.css";

// 宣伝室: サイト内のwebpを添えてXに投稿するための画面。
// スマホの共有メニュー経由で画像と文章を渡す（実機で確認済みの方式）。
// 設計は docs/2026-07-26_promo-room-plan.md を参照。

const STORAGE_KEY = "admin-password";
const LINK_IN_REPLY_KEY = "promo-link-in-reply";
const HASHTAGS_KEY = "promo-hashtags";
const REPLY_DETAIL_KEY = "promo-reply-detail";
const MAX_IMAGES = 4;
const TWEET_LIMIT = 280;
// 型のかたよりを見る窓。直近これだけの共有をさかのぼって、同じ型が続いていないか数える。
const RECENT_TYPE_WINDOW = 5;
// ローテーションに入れない型。避けたいのは同じ型が続くことで、弱い型を掘り起こすことではない。
// 報告型（「【新記事】〜」）は、これだけ伸びが悪いと分かっているので常に最後に置く。
const LAST_LABELS = ["報告"];

type Post = {
  id: string;
  title: string;
  summary?: string;
  status?: string;
  thumbnail?: string;
  images?: string[];
  // 記事の関連リンク。遊べるものへのリンクが混ざっていることがある。
  links?: { label?: string; url?: string }[];
  createdAt?: string;
  updatedAt?: string;
};

type Experience = {
  // 実験室の並び番号。実験にはIDが無いので、これを選択の目印に使う。
  archiveNo?: number;
  title: string;
  summary?: string;
  thumbnail?: string;
  playUrl?: string;
  relatedPostId?: string;
  status?: string;
};

type PromoImage = { path: string; group: string; subgroup: string; tag?: string };

// 動画はGitHubに置かず、R2から取ってくる（public/promo-videos.json が置き場所の一覧）。
// 増やすときはR2にアップして、このJSONに1件足すだけ。
type PromoVideo = { key: string; poster?: string; title: string; seconds?: number; sizeMB?: number };

type MediaMode = "image" | "video";

type LogEntry = {
  kind: "share" | "day";
  id: string;
  at?: string;
  date?: string;
  topic?: string;
  title?: string;
  textType?: string;
  media?: "video" | "images" | "none";
  imageCount?: number;
  question?: boolean;
  replies?: number;
};

// Grokの分析で挙がった「毎日やること」。記録しなくても、目に入るだけで意味がある。
const ROUTINE = [
  "大きめのAI・ゲーム・3D系アカウントに、早めのリプライを8〜15件",
  "1日1本、動画か画像つきで投稿する",
  "投稿してから30分は、返信に反応できる状態でいる",
  "週に1回、うまくいかなかった実験のまとめを出す",
];

type Preset = {
  id: string;
  name: string;
  topic: string;
  postId: string;
  images: string[];
  text: string;
  savedAt: string;
};

type Topic = "site" | "latest" | "random" | "pick" | "play";

type Template = { label: string; text: string };
// 画面に出すときの型。recent = 直近の共有で同じ型を何回使ったか。
type TemplateCard = Template & { order: number; recent: number };

// リンクは1本とは限らない。ゲームなら「遊ぶ」と「作った話」の2本になる。
// url は本文に入れるとき用の代表リンク（リプに回すときは links を並べる）。
type SubjectLink = { label: string; url: string };

type Subject = {
  kind: "site" | "article" | "play";
  label: string;
  title: string;
  summary: string;
  url: string;
  links: SubjectLink[];
  pool: string[];
};

const TOPICS: { key: Topic; label: string; note: string }[] = [
  { key: "site", label: "サイト全体", note: "ラボそのものを宣伝する" },
  { key: "latest", label: "最新記事", note: "いちばん新しい記事" },
  { key: "random", label: "発掘", note: "過去の記事や遊べるものから1つ" },
  { key: "pick", label: "記事を選ぶ", note: "一覧から自分で選ぶ" },
  // 実験そのものの宣伝。記事が無い実験もあるので、記事を経由せず主役にできるようにしてある。
  { key: "play", label: "実験を選ぶ", note: "遊べるものを1つ" },
];

// 実験にはIDが無いので、並び番号を選択の目印にする（無ければタイトル）。
function playKeyOf(experience: Experience): string {
  return experience.archiveNo != null ? String(experience.archiveNo) : experience.title;
}

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
  const [pickedPlayKey, setPickedPlayKey] = useState("");
  const [discovered, setDiscovered] = useState<Subject | null>(null);

  // Xは動画と画像を同じ投稿に入れられないので、どちらか一方だけを選ぶ。
  const [mediaMode, setMediaMode] = useState<MediaMode>("image");
  const [videos, setVideos] = useState<PromoVideo[]>([]);
  const [videoBase, setVideoBase] = useState("");
  const [pickedVideo, setPickedVideo] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoReady, setVideoReady] = useState(true);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [filesReady, setFilesReady] = useState(true);

  // 外したリンク（URLで覚える）。ネタを変えたら消える。
  const [droppedLinks, setDroppedLinks] = useState<string[]>([]);

  const [log, setLog] = useState<LogEntry[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingDay, setSavingDay] = useState(false);
  const [useHashtags, setUseHashtags] = useState(false);
  // リプに回す文章に、リンクだけでなく詳細も入れる（フック→スレッドの形）。
  const [replyDetail, setReplyDetail] = useState(false);

  // どの型から作った文章かを覚えておく。記録に残すのはこの名前（並びは変わるので番号では持てない）。
  const [templateLabel, setTemplateLabel] = useState("");
  const [text, setText] = useState("");
  // 締めの問いかけ。伸びた投稿はどれも軽い問いで終わっているので、既定でon。
  // 本文とは別に持って、共有するときに足す（ハッシュタグと同じ扱い）。
  const [askQuestion, setAskQuestion] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
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

    // 動画の一覧は無くても宣伝はできるので、失敗しても止めない。
    try {
      const videosResponse = await fetch("/promo-videos.json");
      if (videosResponse.ok) {
        const loadedVideos = await videosResponse.json();
        setVideoBase(typeof loadedVideos.base === "string" ? loadedVideos.base : "");
        setVideos(Array.isArray(loadedVideos.videos) ? loadedVideos.videos : []);
      }
    } catch {
      setVideos([]);
    }

    if (postsResponse.status === 401 || experiencesResponse.status === 401) {
      throw new Error("unauthorized");
    }

    const loadedPosts: Post[] = postsResponse.ok ? await postsResponse.json() : [];
    const loadedExperiences: Experience[] = experiencesResponse.ok ? await experiencesResponse.json() : [];
    const loadedImages = imagesResponse.ok ? await imagesResponse.json() : { images: [] };

    setPosts(loadedPosts.filter((post) => post.status === "public" && post.id));
    setExperiences(loadedExperiences.filter((item) => item.status === "live" && item.playUrl));
    setPromoImages(Array.isArray(loadedImages.images) ? loadedImages.images : []);
    // 記録は読めなくても宣伝はできるので、失敗しても止めない。
    try {
      const logResponse = await fetch("/api/promo-log", { headers });
      if (logResponse.ok) setLog(await logResponse.json());
    } catch {
      setLog([]);
    }

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
    setUseHashtags(window.localStorage.getItem(HASHTAGS_KEY) === "on");
    setReplyDetail(window.localStorage.getItem(REPLY_DETAIL_KEY) === "on");

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

  // 宣伝できる実験。遊べないものと公開前のものは、主役に選べても行き先が無いので外す。
  const playableExperiences = useMemo(
    () => experiences.filter((item) => Boolean(item.playUrl) && item.status !== "draft"),
    [experiences]
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
        links: [{ label: "見る", url: siteUrl }],
        pool: siteImagePool,
      };
    }

    if (topic === "latest") {
      const latest = sortedPosts[0];
      return latest ? postSubject(latest, siteUrl, "最新記事", experiences) : null;
    }

    if (topic === "pick") {
      const picked = sortedPosts.find((post) => post.id === pickedPostId);
      return picked ? postSubject(picked, siteUrl, "選んだ記事", experiences) : null;
    }

    if (topic === "play") {
      const picked = playableExperiences.find((item) => playKeyOf(item) === pickedPlayKey);
      return picked ? playSubject(picked, siteUrl, posts) : null;
    }

    return discovered;
  }, [
    topic,
    siteUrl,
    siteImagePool,
    sortedPosts,
    pickedPostId,
    playableExperiences,
    pickedPlayKey,
    posts,
    experiences,
    discovered,
  ]);

  const templateStats = useMemo(
    // 「遊べるものが◯個」は本文に数字として出るので、実際に遊べるものだけを数える。
    () => ({ posts: posts.length, plays: playableExperiences.length }),
    [posts.length, playableExperiences.length]
  );

  const shareLog = useMemo(() => log.filter((entry) => entry.kind === "share"), [log]);

  // 直近で使った型。ネタを変えても同じ型が続くと、並べたときに同じ投稿に見える。
  const recentTypes = useMemo(
    () => shareLog.slice(0, RECENT_TYPE_WINDOW).map((entry) => entry.textType || ""),
    [shareLog]
  );

  // 直近で使っていない型を上に出す。並べ替えるだけで、消しはしない。
  const templates = useMemo<TemplateCard[]>(() => {
    const base = subject ? buildTemplates(subject, topic, templateStats) : [];
    return base
      .map((template, order) => ({
        ...template,
        order,
        recent: recentTypes.filter((type) => type === template.label).length,
      }))
      .sort(
        (a, b) =>
          Number(LAST_LABELS.includes(a.label)) - Number(LAST_LABELS.includes(b.label)) ||
          a.recent - b.recent ||
          a.order - b.order
      );
  }, [subject, topic, templateStats, recentTypes]);

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
    setDroppedLinks([]);
    setTemplateLabel(templates[0]?.label || "");
    setText(templates[0]?.text || "");
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

  // 動画も画像と同じで、共有ボタンを押してから読み込むとiOSで弾かれる。選んだ時点で用意する。
  useEffect(() => {
    let cancelled = false;
    if (!pickedVideo || !videoBase) {
      setVideoFile(null);
      setVideoReady(true);
      return;
    }

    setVideoReady(false);
    (async () => {
      try {
        const response = await fetch(`${videoBase}/${pickedVideo}`);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (cancelled) return;
        const name = pickedVideo.split("/").pop() || "movie.mp4";
        setVideoFile(new File([blob], name, { type: blob.type || "video/mp4" }));
        setVideoReady(true);
      } catch {
        if (cancelled) return;
        setVideoFile(null);
        setVideoReady(true);
        notify("error", "動画を読み込めませんでした。電波を確認して選び直してください。");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pickedVideo, videoBase, notify]);

  function selectMediaMode(next: MediaMode) {
    setMediaMode(next);
    // 混ざらないように、切り替えたら反対側の選択を捨てる。
    if (next === "video") setSelected([]);
    else setPickedVideo("");
  }

  function toggleVideo(key: string) {
    setPickedVideo((prev) => (prev === key ? "" : key));
  }

  async function savePreset() {
    if (!subject || !text.trim()) return;
    const name = presetName.trim() || subject.title;

    setSavingPreset(true);
    try {
      const response = await fetch("/api/promo-presets", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": authPassword },
        // postId は「選んだ主役の目印」として使い回す。実験のときは実験の目印が入る。
        body: JSON.stringify({
          name,
          topic,
          postId: topic === "pick" ? pickedPostId : topic === "play" ? pickedPlayKey : "",
          images: selected,
          text,
        }),
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
    if (preset.postId) {
      if (preset.topic === "play") setPickedPlayKey(preset.postId);
      else setPickedPostId(preset.postId);
    }
    // ネタを戻すと組み直しの処理が走るので、そのあとに保存内容を上書きする。
    window.setTimeout(() => {
      setSelected(preset.images);
      setText(preset.text);
      setTemplateLabel("");
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
      ...sortedPosts.map((post) => postSubject(post, siteUrl, "発掘した記事", experiences)),
      ...playableExperiences.map((item) => playSubject(item, siteUrl, posts)),
    ];
    const next = pickRandom(candidatesForDiscovery);
    if (next) setDiscovered(next);
  }

  function selectTopic(next: Topic) {
    setTopic(next);
    setMessage("");
    if (next === "random") discover();
    if (next === "pick" && !pickedPostId && sortedPosts[0]) setPickedPostId(sortedPosts[0].id);
    if (next === "play" && !pickedPlayKey && playableExperiences[0]) {
      setPickedPlayKey(playKeyOf(playableExperiences[0]));
    }
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

  function applyTemplate(template: TemplateCard) {
    setTemplateLabel(template.label);
    setText(template.text);
  }

  // 共有に載せるのは、動画モードなら動画1本、そうでなければ選んだ画像。
  const shareFiles = mediaMode === "video" ? (videoFile ? [videoFile] : []) : files;
  const mediaReady = mediaMode === "video" ? videoReady : filesReady;

  const todayReplies = useMemo(() => {
    const found = log.find((entry) => entry.kind === "day" && entry.date === today());
    return found?.replies ?? null;
  }, [log]);

  const tags = useHashtags ? hashtagsFor(subject).join(" ") : "";

  const questions = useMemo(() => questionsFor(subject, topic), [subject, topic]);
  const questionLine = questions[questionIndex % (questions.length || 1)] || "";
  // 「質問」型は文章そのものが問いで終わるので、足すぶんは外す（同じ投稿に問いが2つ並ぶのを防ぐ）。
  const question = askQuestion && templateLabel !== "質問" ? questionLine : "";

  // 使うリンク。既定は全部on。ゲームなら「遊ぶ」と「作った話」の2本になる。
  const activeLinks = useMemo(
    () => (subject ? subject.links.filter((link) => !droppedLinks.includes(link.url)) : []),
    [subject, droppedLinks]
  );

  // リプに回すときは本文にURLを入れない。投稿後に②でコピーして自分の投稿へ返信する。
  // 本文に入れる場合は1本だけ（複数入れるとリーチがさらに落ちると言われている）。
  const bodyLink = !linkInReply ? (activeLinks[0]?.url ?? subject?.url ?? "") : "";
  const shareBody = [text.trim(), question, bodyLink, tags].filter(Boolean).join("\n\n");
  const used = tweetWeight(shareBody);

  // ②で貼る文章。リンクが2本あるときは行頭に何のリンクかを書く。
  const replyText = useMemo(() => {
    if (!subject) return "";
    const lines = activeLinks.map((link) =>
      activeLinks.length > 1 ? `${link.label}▶ ${link.url}` : link.url
    );
    const detail = replyDetail ? subject.summary?.trim() : "";
    return [detail, lines.join("\n")].filter(Boolean).join("\n\n");
  }, [subject, replyDetail, activeLinks]);

  function toggleLinkInReply(next: boolean) {
    setLinkInReply(next);
    setSharedOnce(false);
    window.localStorage.setItem(LINK_IN_REPLY_KEY, next ? "on" : "off");
  }

  function toggleHashtags(next: boolean) {
    setUseHashtags(next);
    window.localStorage.setItem(HASHTAGS_KEY, next ? "on" : "off");
  }

  function toggleReplyDetail(next: boolean) {
    setReplyDetail(next);
    window.localStorage.setItem(REPLY_DETAIL_KEY, next ? "on" : "off");
  }

  async function copyLink() {
    if (!subject) return;
    try {
      await navigator.clipboard.writeText(replyText);
      notify("ok", "コピーしました。さっきの投稿に返信して貼り付けてください。");
    } catch {
      setRawFallback(replyText);
      notify("info", "自動コピーできませんでした。下の枠の文章を手でコピーしてください。");
    }
  }

  // 何をいつ出したかを残す。数字は取れないので、型と中身だけ記録する。
  async function recordShare() {
    if (!subject) return;
    try {
      const response = await fetch("/api/promo-log", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": authPassword },
        body: JSON.stringify({
          kind: "share",
          topic,
          title: subject.title,
          textType: templateLabel || "自作",
          media: mediaMode === "video" ? (videoFile ? "video" : "none") : selected.length ? "images" : "none",
          imageCount: mediaMode === "video" ? 0 : selected.length,
          linkInReply,
          hashtags: useHashtags,
          question: Boolean(question),
        }),
      });
      if (response.ok) setLog(await response.json());
    } catch {
      // 記録に失敗しても共有そのものは終わっているので、邪魔しない。
    }
  }

  async function recordDay() {
    const replies = Number(replyDraft);
    if (!Number.isFinite(replies) || replies < 0) {
      notify("error", "件数は0以上の数字で入れてください。");
      return;
    }

    setSavingDay(true);
    try {
      const response = await fetch("/api/promo-log", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": authPassword },
        body: JSON.stringify({ kind: "day", date: today(), replies }),
      });
      const body = await response.json();
      if (!response.ok) {
        notify("error", body.message || "記録できませんでした。");
        return;
      }
      setLog(body);
      setReplyDraft("");
      notify("ok", `今日のリプライ ${replies}件を記録しました。`);
    } catch {
      notify("error", "記録できませんでした。通信を確認してください。");
    } finally {
      setSavingDay(false);
    }
  }

  async function share() {
    if (!subject) return;
    setRawFallback("");

    const payload: ShareData = { text: shareBody };
    if (shareFiles.length > 0) payload.files = shareFiles;

    const canUseShare =
      typeof navigator.share === "function" &&
      (shareFiles.length === 0 || typeof navigator.canShare !== "function" || navigator.canShare(payload));

    if (!canUseShare) {
      await fallbackShare();
      return;
    }

    try {
      await navigator.share(payload);
      setSharedOnce(true);
      void recordShare();
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
    const noun = mediaMode === "video" ? "動画" : "画像";
    try {
      await navigator.clipboard.writeText(shareBody);
      notify("ok", `この端末では共有メニューが使えないので、文章をコピーして${noun}を保存しました。`);
    } catch {
      setRawFallback(shareBody);
      notify("info", `文章は下の枠から手でコピーしてください。${noun}は保存します。`);
    }

    // 動画は手元に落として、Xアプリで自分で添付してもらう。
    if (mediaMode === "video") {
      if (!videoFile) return;
      const objectUrl = URL.createObjectURL(videoFile);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = videoFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return;
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

          {topic === "play" ? (
            <select
              className="promoSelect"
              value={pickedPlayKey}
              onChange={(event) => setPickedPlayKey(event.target.value)}
            >
              {playableExperiences.map((item) => (
                <option key={playKeyOf(item)} value={playKeyOf(item)}>
                  {item.title}
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
              {subject.links.map((link) => (
                <span key={link.url} className="promoSubjectUrl">
                  {subject.links.length > 1 ? `${link.label}: ` : ""}
                  {link.url}
                </span>
              ))}
            </div>
          ) : (
            <p className="promoStepNote">宣伝できるものが見つかりませんでした。</p>
          )}
        </section>

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">STEP 2</span>
            <h2 className="promoStepTitle">{videos.length > 0 ? "画像か動画を選ぶ" : "画像を選ぶ"}</h2>
          </div>

          {videos.length > 0 ? (
            <div className="promoTagRow">
              <button
                type="button"
                className="promoTag"
                aria-pressed={mediaMode === "image"}
                onClick={() => selectMediaMode("image")}
              >
                画像
              </button>
              <button
                type="button"
                className="promoTag"
                aria-pressed={mediaMode === "video"}
                onClick={() => selectMediaMode("video")}
              >
                動画
              </button>
            </div>
          ) : null}

          <p className="promoStepNote">
            {mediaMode === "video"
              ? "動画は1本だけ入ります。Xは動画と画像を同じ投稿に混ぜられないので、切り替えると反対側の選択は外れます。"
              : `候補から選んでください（${MAX_IMAGES}枚まで、なしでも投稿できます）。ピンとこなければ引き直せます。`}
          </p>

          {mediaMode === "video" ? (
            <div className="promoVideos">
              {videos.map((video) => (
                <button
                  key={video.key}
                  type="button"
                  className="promoVideo"
                  aria-pressed={pickedVideo === video.key}
                  onClick={() => toggleVideo(video.key)}
                >
                  {video.poster ? (
                    // 本数が少ないので遅延読み込みはしない（出ないより出た方がよい）。
                    <img src={`${videoBase}/${video.poster}`} alt="" />
                  ) : (
                    <span className="promoVideoNoPoster">動画</span>
                  )}
                  <span className="promoVideoMeta">
                    <span className="promoVideoTitle">{video.title}</span>
                    <span className="promoVideoSize">
                      {[video.seconds ? `${video.seconds}秒` : "", video.sizeMB ? `${video.sizeMB}MB` : ""]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </span>
                </button>
              ))}
              {pickedVideo ? (
                <p className="promoStepNote">
                  {videoReady
                    ? videoFile
                      ? `動画の用意ができました（${(videoFile.size / (1024 * 1024)).toFixed(1)}MB）。`
                      : "動画を用意できませんでした。選び直してください。"
                    : "動画を読み込んでいます…（電波によっては少しかかります）"}
                </p>
              ) : null}
            </div>
          ) : null}

          {mediaMode === "image" && topic === "site" && availableTags.length > 0 ? (
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

          {mediaMode === "image" && selected.length > 0 ? (
            <div className="promoSelected">
              {selected.map((path) => (
                <button key={path} type="button" className="promoSelectedItem" onClick={() => toggleImage(path)}>
                  <img src={path} alt="選んだ画像" />
                  <span className="promoSelectedRemove">外す</span>
                </button>
              ))}
            </div>
          ) : null}

          {mediaMode === "image" ? (
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
          ) : null}

          <div className="promoRowActions">
            <button
              type="button"
              className="promoGhostButton"
              disabled={mediaMode === "video" || !subject || subject.pool.length <= MAX_IMAGES}
              onClick={() => subject && rollCandidates(subject.pool, selected)}
            >
              別の候補を見る
            </button>
            <button
              type="button"
              className="promoGhostButton"
              disabled={mediaMode === "video" ? !pickedVideo : selected.length === 0}
              onClick={() => (mediaMode === "video" ? setPickedVideo("") : setSelected([]))}
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
            伸びた投稿はどれも「1行目で言い切る」＋「軽い問いかけで締める」の組み合わせでした。
            直近{RECENT_TYPE_WINDOW}回で使った型は下に送ってあります。そのまま使っても、直してもかまいません。
          </p>
          <div className="promoTemplates">
            {templates.map((template) => (
              <button
                key={template.text}
                type="button"
                className="promoTemplate"
                aria-pressed={text === template.text}
                onClick={() => applyTemplate(template)}
              >
                <span className="promoTemplateLabel">
                  {template.label}
                  {template.recent > 0 ? (
                    <em className="promoTemplateRecent">直近{template.recent}回使用</em>
                  ) : null}
                </span>
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
          <div className="promoTagRow">
            <button
              type="button"
              className="promoTag"
              aria-pressed={askQuestion}
              onClick={() => setAskQuestion(!askQuestion)}
            >
              問いかけで締める
            </button>
            {question ? <span className="promoTagPreview">{question}</span> : null}
            {question && questions.length > 1 ? (
              <button
                type="button"
                className="promoTag"
                onClick={() => setQuestionIndex((index) => (index + 1) % questions.length)}
              >
                別の問い
              </button>
            ) : null}
            {askQuestion && templateLabel === "質問" ? (
              <span className="promoTagPreview">この型は文章の中に問いがあるので足しません。</span>
            ) : null}
          </div>
          <div className="promoTagRow">
            <button
              type="button"
              className="promoTag"
              aria-pressed={useHashtags}
              onClick={() => toggleHashtags(!useHashtags)}
            >
              タグを付ける
            </button>
            {useHashtags ? <span className="promoTagPreview">{hashtagsFor(subject).join(" ")}</span> : null}
          </div>

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
          {subject && subject.links.length > 1 ? (
            <>
              <p className="promoStepNote">
                この宣伝で使うリンク。遊べるものは「遊ぶ」を先に置いています。
              </p>
              <div className="promoTagRow">
                {subject.links.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    className="promoTag"
                    aria-pressed={!droppedLinks.includes(link.url)}
                    onClick={() =>
                      setDroppedLinks((prev) =>
                        prev.includes(link.url) ? prev.filter((url) => url !== link.url) : [...prev, link.url]
                      )
                    }
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

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
            disabled={!subject || !text.trim() || !mediaReady}
            onClick={() => void share()}
          >
            {!mediaReady
              ? mediaMode === "video"
                ? "動画を準備中…"
                : "画像を準備中…"
              : `${linkInReply ? "① " : ""}共有する${
                  mediaMode === "video"
                    ? videoFile
                      ? "（動画1本）"
                      : ""
                    : selected.length
                      ? `（画像${selected.length}枚）`
                      : ""
                }`}
          </button>

          {linkInReply ? (
            <>
              <div className="promoTagRow">
                <button
                  type="button"
                  className="promoTag"
                  aria-pressed={replyDetail}
                  onClick={() => toggleReplyDetail(!replyDetail)}
                >
                  リプに詳細も書く
                </button>
              </div>
              <p className="promoStepNote">
                {replyDetail
                  ? "1枚目はフックだけにして、リプに要約とリンクを置きます（スレッドの形）。"
                  : "リプにはリンクだけ置きます。"}
              </p>
              <button
                type="button"
                className={sharedOnce ? "promoShareButton" : "promoGhostButton promoWideButton"}
                disabled={!subject}
                onClick={() => void copyLink()}
              >
                {replyDetail ? "② リプ用の文章をコピー" : "② リンクをコピー（リプに貼る用）"}
              </button>
            </>
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

        <section className="promoStep">
          <div className="promoStepHead">
            <span className="promoStepNo">毎日</span>
            <h2 className="promoStepTitle">今日やること</h2>
          </div>
          <p className="promoStepNote">
            投稿そのものより、この4つのほうが効くと言われています。できた日だけ数を入れれば残ります。
          </p>
          <ul className="promoRoutine">
            {ROUTINE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="promoSaveRow">
            <input
              className="promoNameInput"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={todayReplies === null ? "今日のリプライ件数" : `今日は${todayReplies}件と記録済み`}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
            />
            <button
              type="button"
              className="promoGhostButton"
              disabled={!replyDraft.trim() || savingDay}
              onClick={() => void recordDay()}
            >
              {savingDay ? "記録中…" : "記録"}
            </button>
          </div>
        </section>

        {shareLog.length > 0 ? (
          <section className="promoStep">
            <div className="promoStepHead">
              <span className="promoStepNo">記録</span>
              <h2 className="promoStepTitle">最近の宣伝</h2>
            </div>
            <p className="promoStepNote">
              どの型でどれだけ出したかが残ります。伸び方の違いは、ここと突き合わせて見てください。
            </p>
            <ul className="promoHistory">
              {shareLog.slice(0, 8).map((entry) => (
                <li key={entry.id}>
                  <span className="promoHistoryDate">{formatLogDate(entry.at)}</span>
                  <span className="promoHistoryType">
                    {entry.textType}
                    {entry.question ? "＋問い" : ""}
                  </span>
                  <span className="promoHistoryTitle">{entry.title}</span>
                  <span className="promoHistoryMedia">
                    {entry.media === "video" ? "動画" : entry.media === "images" ? `画像${entry.imageCount}` : "文章のみ"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

// 日付は手元の時間で数える。UTCで切ると、夜に記録したぶんが前日扱いになる。
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatLogDate(at?: string) {
  if (!at) return "";
  const date = new Date(at);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function dateValue(post: Post) {
  return Date.parse(post.updatedAt || post.createdAt || "") || 0;
}

function postSubject(post: Post, siteUrl: string, label: string, experiences: Experience[]): Subject {
  const pool = [post.thumbnail, ...(post.images || [])].filter((path): path is string => Boolean(path));
  const readUrl = `${siteUrl}/read/${post.id}`;

  // 遊べるものへの結び付きは2通りある。体験格納庫側の relatedPostId と、
  // 記事側の関連リンク。片方しか埋まっていない組み合わせがあるので両方から拾う。
  // 記事の関連リンクは他人のXポストなども混ざるため、体験格納庫にあるURLだけを通す。
  const linkedUrls = (post.links || [])
    .map((link) => sameUrlKey(link.url))
    .filter((key): key is string => Boolean(key));

  const plays = experiences.filter((item) => {
    if (!item.playUrl) return false;
    if (item.relatedPostId === post.id) return true;
    const key = sameUrlKey(item.playUrl);
    return Boolean(key && linkedUrls.includes(key));
  });

  const links: SubjectLink[] = [];
  for (const play of plays) {
    if (!play.playUrl) continue;
    // 遊べるものが2つ以上ぶら下がっている記事もあるので、そのときはどれか分かるようにする。
    links.push({ label: plays.length > 1 ? `遊ぶ:${truncate(play.title, 8)}` : "遊ぶ", url: play.playUrl });
  }
  links.push({ label: "読む", url: readUrl });

  return {
    kind: "article",
    label,
    title: post.title,
    summary: truncate(post.summary || "", 70),
    url: readUrl,
    links: dedupeLinks(links),
    pool: unique(pool),
  };
}

// 末尾のスラッシュや大文字小文字だけが違うURLは同じものとして扱う。
function sameUrlKey(url?: string): string {
  if (!url) return "";
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

function dedupeLinks(links: SubjectLink[]): SubjectLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = sameUrlKey(link.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function playSubject(experience: Experience, siteUrl: string, posts: Post[]): Subject {
  // 記事との結び付きは2通りある。実験室側の relatedPostId と、記事側の関連リンク。
  // postSubject と同じく両方から拾う。片方しか埋まっていない組み合わせがあり、
  // relatedPostId だけを見ていると「記事が無い実験」に見えてしまう（例: よこぼカート3Dは記事3本）。
  const playKey = sameUrlKey(experience.playUrl);
  const related = posts
    .filter((post) => {
      if (post.status !== "public") return false;
      if (experience.relatedPostId && post.id === experience.relatedPostId) return true;
      if (!playKey) return false;
      return (post.links || []).some((link) => sameUrlKey(link.url) === playKey);
    })
    .sort((a, b) => dateValue(b) - dateValue(a));

  const pool = [
    experience.thumbnail,
    ...related.flatMap((post) => [post.thumbnail, ...(post.images || [])]),
  ].filter((path): path is string => Boolean(path));

  // 遊べるものは、まず遊んでもらうのが先。代表リンクも遊ぶページにする。
  const links: SubjectLink[] = [];
  if (experience.playUrl) links.push({ label: "遊ぶ", url: experience.playUrl });
  for (const post of related) {
    // 1つの遊べるものに記事が何本もぶら下がることがあるので、そのときはどれか分かるようにする。
    links.push({
      label: related.length > 1 ? `作った話:${truncate(post.title, 8)}` : "作った話",
      url: `${siteUrl}/read/${post.id}`,
    });
  }
  if (links.length === 0) links.push({ label: "見る", url: `${siteUrl}/experiments` });

  const deduped = dedupeLinks(links);

  return {
    kind: "play",
    label: "遊べるもの",
    title: experience.title,
    summary: truncate(experience.summary || "", 70),
    url: deduped[0]?.url ?? `${siteUrl}/experiments`,
    links: deduped,
    pool: unique(pool),
  };
}

// 文章の型は3種類。上から順に伸びやすいと言われている順に並べる。
//   フック = 1行目で結果や意外性を言う（「【新記事】〜」のような告知型は素通りされやすい）
//   質問   = 返信を誘う締め。返信は「いいね」より重いシグナルとされる
//   報告   = 従来の告知型。落ち着いて出したいときのために残してある
// いずれも出典はマーケティング系の解説でX公式の仕様ではないので、型は選べるままにしてある。
function buildTemplates(subject: Subject, topic: Topic, stats: { posts: number; plays: number }): Template[] {
  const { title, summary } = subject;
  const body = summary ? `\n\n${summary}` : "";

  if (subject.kind === "site") {
    // 数字は実物から入れる（記事数・遊べるものの数）。具体的な数字があるほど強い。
    return [
      {
        label: "フック",
        text: `コードは書けません。全部AIにやらせた実験が${stats.posts}本たまりました。\nゲームも3Dも動画も、ぜんぶ置いてあります。`,
      },
      {
        label: "フック",
        text: `非エンジニアがAIと遊び倒したら、ブラウザで遊べるものが${stats.plays}個できていました。\n失敗した実験もそのまま残してあります。`,
      },
      {
        label: "質問",
        text: "AIにどこまで任せられるか、ひたすら試して記録しているラボです。\n次は何を作らせたら面白いと思いますか？",
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

  // 発掘は「掘り返した」という切り口が主役なので、遊べるものが当たったときも掘り返しの型を出す。
  // 順番を逆にすると、発掘で遊べるものを引いたときに「実験を選ぶ」と同じ4本になり、
  // ネタを変えたのに同じ投稿に見える（掘り返しの型はどこからも出なくなる）。
  if (topic === "random") {
    return [
      { label: "フック", text: `昔の実験を掘り返したら、力尽きた跡が出てきました。\n${title}${body}` },
      { label: "フック", text: `当時はこれが限界でした。今のAIなら違う結果になった気がします。\n${title}` },
      { label: "質問", text: `${title}\nここで止まったままなんですが、続きをやるなら何から手をつけますか？` },
      { label: "報告", text: `そういえば、こんな実験もしてました。\n${title}${body}` },
    ];
  }

  if (subject.kind === "play") {
    return [
      { label: "フック", text: `コードを書かずにAIと作ったゲームが、ブラウザでそのまま遊べます。\n${title}` },
      { label: "フック", text: `インストールなし、開いた瞬間に遊べます。スマホでもどうぞ。\n${title}${body}` },
      { label: "質問", text: `${title}\n遊べる形にはなったんですが、次に何を足すと面白くなりますか？` },
      { label: "報告", text: `${title}\nAIと一緒に作りました。よかったら遊んでみてください。` },
    ];
  }

  // 記事の要約は、型ごとに扱いを変える。
  // 全部の型に同じ要約を同じ位置で差し込んでいた頃は、型を分けても
  // 「同じ話を言い方だけ変えたもの」が4つ並んでいた（要約の1行目が毎回そのまま出だしになる）。
  //   要約なし = タイトルと自分の言葉だけで立たせる
  //   要約を後ろ = フックや問いのあとに、説明として置く
  //   要約が先頭 = 要約が短くて強い記事のときだけ速い
  // あわせて、1行目がタイトルで始まる型は1つまでにしてある。
  return [
    { label: "フック", text: `非エンジニアがAIに丸投げしたら、ここまで来ました。\n${title}` },
    { label: "フック", text: `うまくいった話より、詰まって直した話のほうが長くなりました。\n${title}` },
    // 対比の型。「高いAIを使わずに手元のPCで」と言い切った回がいちばん伸びた。
    // サービス名は入れない（すぐ古くなるし、名前を出すと主役がそっちに移る）。
    { label: "フック", text: `高いAIには頼っていません。手元のPCだけで、ここまで作れるようになりました。\n${title}` },
    {
      label: "フック",
      text: summary ? `${summary}\n\n${title}` : `${title}\n\nAIに任せてみた記録です。`,
    },
    // 問いは最後に置く型なので、ここだけタイトル始まりのまま。そのかわり要約は入れない。
    { label: "質問", text: `${title}\n\n同じことを試している人いますか？やり方の意見ももらえると嬉しいです。` },
    { label: "報告", text: `【新記事】${title}${body}` },
  ];
}

// 締めに足す問いかけ。返信が付いた投稿だけが伸びているのに、返信はほとんど発生していない。
// 型のほうを「質問」に切り替えると出だしまで変わってしまうので、締めだけを差し替えられるようにしてある。
// 先頭はネタに合わせたもの、後ろは何にでも足せるもの。
function questionsFor(subject: Subject | null, topic: Topic): string[] {
  const generic = ["すごくないですか？？", "ここ、どう直すともっと良くなると思いますか？"];

  if (!subject) return generic;
  if (subject.kind === "site") return ["次は何を作らせたら面白いと思いますか？", ...generic];
  if (topic === "random") return ["続きをやるなら、何から手をつけますか？", ...generic];
  if (subject.kind === "play") return ["次に何を足すと面白くなりますか？", ...generic];
  return ["同じことを試している人いますか？", ...generic];
}

// ネタごとの固定タグ。詰め込むと逆効果と言われているので2〜3個まで。
function hashtagsFor(subject: Subject | null): string[] {
  if (!subject) return [];
  if (subject.kind === "play") return ["#個人開発", "#ゲーム制作", "#AI"];
  if (subject.kind === "site") return ["#AI", "#個人開発", "#非エンジニア"];
  return ["#AI", "#AI開発日誌"];
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
