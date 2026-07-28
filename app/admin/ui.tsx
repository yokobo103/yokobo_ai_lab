"use client";

/* eslint-disable @next/next/no-img-element */
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { authorProfiles, defaultAuthorId, getAuthorProfile, type AuthorId } from "@/lib/authors";
import { defaultResultStatusId, getResultStatus, resultStatuses, type ResultStatusId } from "@/lib/result-statuses";
import { categories, researchLogCategories, type Post, type ResearchLogCategory } from "@/lib/schema";
import { EmbeddedMarkdown } from "../_redesign/components/EmbeddedMarkdown";
import { markdownToHtml } from "../_redesign/utils/markdown";
import "./admin.css";

const STORAGE_KEY = "admin-password";
type AdminView = "home" | "logs" | "editor" | "experiments" | "settings";
type StatusFilter = "all" | "draft" | "public";
type SortKey = "updated" | "created" | "title";
type EditorTab = "edit" | "preview" | "history";
type BodySelection = {
  start: number;
  end: number;
  scrollTop: number;
};

type AdminExperience = {
  archiveNo: number;
  title: string;
  category: string;
  summary: string;
  thumbnail?: string;
  labThumbnail?: string;
  tags?: string[];
  playUrl?: string;
  relatedPostId?: string;
  relatedPostIds?: string[];
  status?: "live" | "wip";
  featured?: boolean;
  addedAt?: string;
};

type SiteUpdate = {
  id: string;
  date: string;
  title: string;
  href: string;
};

const experimentCategories = [
  ["game", "ゲーム"],
  ["tool", "ツール"],
  ["3d-ar", "3D・AR"],
  ["web", "Web"],
  ["av", "動画・音声"],
  ["prototype", "プロトタイプ"]
] as const;

const emptyPost = (): Post => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    summary: "",
    author: defaultAuthorId,
    experimentResult: "実験結果メモは編集中です。",
    resultStatus: defaultResultStatusId,
    category: "気づき・ログ",
    categories: [],
    logCategory: "開発ログ",
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

function postAuthor(post: Post) {
  return getAuthorProfile(post.author);
}

function postExperimentResult(post: Post) {
  return post.experimentResult || "実験結果メモは編集中です。";
}

function postResultStatus(post: Post) {
  return getResultStatus(post.resultStatus);
}

function truncateText(value: string, maxLength = 80) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
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

function formatTagText(post: Post) {
  return post.tags?.map((tag) => `#${tag}`).join(" ") ?? "";
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

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function displayDateToInputDate(value: string) {
  return value.replaceAll(".", "-");
}

type AdminAppProps = {
  initialView?: AdminView;
  initialPostId?: string;
};

export default function AdminApp({ initialView = "home", initialPostId }: AdminAppProps) {
  const [passwordInput, setPasswordInput] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(STORAGE_KEY) ?? ""
  );
  const [authPassword, setAuthPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<SiteUpdate[]>([]);
  const [siteUpdateDraft, setSiteUpdateDraft] = useState<SiteUpdate>(() => ({
    id: "",
    date: todayInputDate(),
    title: "",
    href: "/",
  }));
  const [current, setCurrent] = useState<Post>(() => emptyPost());
  const [tagDraft, setTagDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingExperienceArchiveNo, setSavingExperienceArchiveNo] = useState<number | null>(null);
  const [savingSiteUpdate, setSavingSiteUpdate] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publicPath, setPublicPath] = useState("");
  const [view, setView] = useState<AdminView>(initialView);
  const [editorTab, setEditorTab] = useState<EditorTab>("edit");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [siteOrigin, setSiteOrigin] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const bodySelectionRef = useRef<BodySelection>({ start: 0, end: 0, scrollTop: 0 });

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
        const haystack = [post.title, post.summary, post.body, post.experimentResult, postAuthor(post).name, post.id, ...(post.tags ?? [])].join(" ").toLowerCase();
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
  const currentCopyText = makeTweetCopyText(current);
  const currentCanShare = canSharePost(current);
  const thumbnailOptions = useMemo(() => posts.filter((post) => post.thumbnail), [posts]);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!authed || !posts.length || !initialPostId) return;
    if (initialPostId === "new") {
      startNewPost();
      return;
    }
    const post = posts.find((item) => item.id === initialPostId);
    if (post) selectPost(post);
  }, [authed, initialPostId, posts]);

  function getPublicPostUrl(post: Post) {
    if (!siteOrigin || post.status !== "public" || !post.id) return "";
    return `${siteOrigin}/read/${post.id}`;
  }

  function canSharePost(post: Post) {
    return Boolean(siteOrigin && post.status === "public" && post.id);
  }

  function makeTweetText(post: Post) {
    const lines = ["【新記事】", "", postTitle(post)];
    const summary = truncateText(post.summary || "");
    if (summary) lines.push("", summary);
    lines.push("", "試行錯誤をまとめました👇");
    return lines.join("\n");
  }

  function makeTweetCopyText(post: Post) {
    const url = getPublicPostUrl(post);
    return url ? `${makeTweetText(post)}\n\n${url}` : makeTweetText(post);
  }

  async function copyTweet(post = current) {
    const text = makeTweetCopyText(post);
    try {
      await navigator.clipboard.writeText(text);
      setMessage("投稿文をコピーしました。");
    } catch {
      setMessage("コピーできませんでした。投稿文を選択してコピーしてください。");
    }
  }

  function openTweetIntent(post = current) {
    const url = getPublicPostUrl(post);
    if (!url) {
      setMessage("公開済みの記事URLがないため、X投稿を作成できません。");
      return;
    }

    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(makeTweetText(post))}&url=${encodeURIComponent(url)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  }

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
      const experienceData = await reloadExperiences(pass);
      const siteUpdateData = await reloadSiteUpdates(pass);
      setPosts(data);
      setExperiences(experienceData);
      setSiteUpdates(siteUpdateData);
      setAuthed(true);
      setAuthPassword(pass);
      sessionStorage.setItem(STORAGE_KEY, pass);
      const nextCurrent = data[0] ?? emptyPost();
      setCurrent(nextCurrent);
      setTagDraft(formatTagText(nextCurrent));
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
    setExperiences([]);
    setSiteUpdates([]);
    const nextCurrent = emptyPost();
    setCurrent(nextCurrent);
    setTagDraft(formatTagText(nextCurrent));
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

  async function reloadExperiences(pass = authPassword) {
    const response = await fetch("/api/experiences", {
      headers: { "x-admin-password": pass, "ngrok-skip-browser-warning": "true" }
    });
    if (!response.ok) return [];
    return (await response.json()) as AdminExperience[];
  }

  async function reloadSiteUpdates(pass = authPassword) {
    const response = await fetch("/api/site-updates", {
      headers: { "x-admin-password": pass, "ngrok-skip-browser-warning": "true" }
    });
    if (!response.ok) return [];
    const data = (await response.json()) as SiteUpdate[];
    setSiteUpdates(data);
    return data;
  }

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setCurrent((post) => ({ ...post, [key]: value }));
  }

  function startNewPost() {
    const nextCurrent = emptyPost();
    setCurrent(nextCurrent);
    setTagDraft(formatTagText(nextCurrent));
    setLinkDraft(formatLinkText(nextCurrent));
    setPublicPath("");
    setEditorTab("edit");
    setView("editor");
  }

  function selectPost(post: Post) {
    setCurrent(post);
    setTagDraft(formatTagText(post));
    setLinkDraft(formatLinkText(post));
    setPublicPath(post.status === "public" ? `/read/${post.id}` : "");
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

  function setTagText(value: string) {
    setTagDraft(value);
    update("tags", splitTags(value));
  }

  function rememberBodySelection() {
    const textarea = bodyRef.current;
    if (!textarea) return bodySelectionRef.current;

    const selection = {
      start: textarea.selectionStart ?? current.body.length,
      end: textarea.selectionEnd ?? current.body.length,
      scrollTop: textarea.scrollTop
    };
    bodySelectionRef.current = selection;
    return selection;
  }

  function currentBodySelection(textarea: HTMLTextAreaElement) {
    const fallback = bodySelectionRef.current;
    const hasLiveSelection = document.activeElement === textarea || textarea.selectionStart !== textarea.selectionEnd;
    const start = hasLiveSelection ? textarea.selectionStart : fallback.start;
    const end = hasLiveSelection ? textarea.selectionEnd : fallback.end;
    return {
      start: Math.min(start ?? current.body.length, current.body.length),
      end: Math.min(end ?? current.body.length, current.body.length),
      scrollTop: textarea.scrollTop || fallback.scrollTop
    };
  }

  function restoreBodySelection(textarea: HTMLTextAreaElement, start: number, end: number, scrollTop: number) {
    const windowX = window.scrollX;
    const windowY = window.scrollY;
    bodySelectionRef.current = { start, end, scrollTop };

    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.scrollTop = scrollTop;
      textarea.setSelectionRange(start, end);
      window.scrollTo(windowX, windowY);
    });
  }

  function insertAtCursor(markdown: string) {
    const textarea = bodyRef.current;
    if (!textarea) {
      update("body", `${current.body}${current.body ? "\n\n" : ""}${markdown}`);
      return;
    }

    const selection = currentBodySelection(textarea);
    const start = selection.start;
    const end = selection.end;
    const before = current.body.slice(0, start);
    const after = current.body.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n" : "";
    const nextBody = `${before}${prefix}${markdown}${suffix}${after}`;
    update("body", nextBody);
    const pos = before.length + prefix.length + markdown.length;
    restoreBodySelection(textarea, pos, pos, selection.scrollTop);
  }

  function wrapSelection(prefix: string, suffix: string, placeholder: string, block = false) {
    const textarea = bodyRef.current;
    if (!textarea) {
      insertAtCursor(`${prefix}${placeholder}${suffix}`);
      return;
    }

    const selection = currentBodySelection(textarea);
    const start = selection.start;
    const end = selection.end;
    const before = current.body.slice(0, start);
    const selected = current.body.slice(start, end) || placeholder;
    const after = current.body.slice(end);
    const markdown = `${prefix}${selected}${suffix}`;
    const linePrefix = block && before && !before.endsWith("\n") ? "\n\n" : "";
    const lineSuffix = block && after && !after.startsWith("\n") ? "\n\n" : "";
    const nextBody = `${before}${linePrefix}${markdown}${lineSuffix}${after}`;

    update("body", nextBody);
    const selectionStart = before.length + linePrefix.length + prefix.length;
    const selectionEnd = selectionStart + selected.length;
    restoreBodySelection(textarea, selectionStart, selectionEnd, selection.scrollTop);
  }

  function prefixSelectedLines(prefix: string, placeholder: string) {
    const textarea = bodyRef.current;
    if (!textarea) {
      insertAtCursor(`${prefix}${placeholder}`);
      return;
    }

    const selection = currentBodySelection(textarea);
    const beforeSelection = current.body.slice(0, selection.start);
    const lineStart = beforeSelection.lastIndexOf("\n") + 1;
    const lineEndBreak = current.body.indexOf("\n", selection.end);
    const lineEnd = lineEndBreak === -1 ? current.body.length : lineEndBreak;
    const before = current.body.slice(0, lineStart);
    const selectedBlock = current.body.slice(lineStart, lineEnd) || placeholder;
    const after = current.body.slice(lineEnd);
    const formatted = selectedBlock
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line || placeholder}`))
      .join("\n");

    update("body", `${before}${formatted}${after}`);
    const nextStart = lineStart + prefix.length;
    const nextEnd = lineStart + formatted.length;
    restoreBodySelection(textarea, nextStart, nextEnd, selection.scrollTop);
  }

  function insertHorizontalLine() {
    insertAtCursor("---");
  }

  function insertMarkdownImage(image: string) {
    insertAtCursor(`![画像](${image})`);
  }

  function relatedPostIdsForExperience(experience: AdminExperience) {
    return [...new Set([...(experience.relatedPostIds ?? []), experience.relatedPostId].filter(Boolean) as string[])];
  }

  function resolveAutoExperimentThumbnail(experience: AdminExperience) {
    const relatedIds = relatedPostIdsForExperience(experience);
    const relatedThumbnail = relatedIds
      .map((id) => posts.find((post) => post.id === id && post.thumbnail)?.thumbnail)
      .find(Boolean);
    return relatedThumbnail || experience.thumbnail || "";
  }

  function resolvedExperimentThumbnailLabel(experience: AdminExperience) {
    if (experience.labThumbnail) return "指定サムネ";
    const relatedIds = relatedPostIdsForExperience(experience);
    const relatedPost = relatedIds.map((id) => posts.find((post) => post.id === id && post.thumbnail)).find(Boolean);
    if (relatedPost) return `先頭関連ログ: ${postTitle(relatedPost)}`;
    if (experience.thumbnail) return "既存サムネ";
    return "fallback";
  }

  function updateExperienceDraft(archiveNo: number, patch: Partial<AdminExperience>) {
    setExperiences((items) => items.map((item) => (item.archiveNo === archiveNo ? { ...item, ...patch } : item)));
  }

  async function saveExperience(experience: AdminExperience) {
    setSavingExperienceArchiveNo(experience.archiveNo);
    setMessage("");
    const response = await fetch("/api/experiences", {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({
        archiveNo: experience.archiveNo,
        title: experience.title,
        summary: experience.summary,
        category: experience.category,
        tags: experience.tags ?? [],
        playUrl: experience.playUrl ?? "",
        status: experience.status ?? "wip",
        featured: Boolean(experience.featured),
        labThumbnail: experience.labThumbnail ?? "",
        relatedPostIds: relatedPostIdsForExperience(experience),
      })
    });
    const data = await response.json();
    setSavingExperienceArchiveNo(null);

    if (!response.ok) {
      setMessage(data.message || "実験を保存できませんでした。");
      return;
    }

    setExperiences((items) => items.map((item) => (item.archiveNo === data.archiveNo ? data : item)));
    setMessage("実験を保存しました。");
  }

  async function createExperience() {
    setSavingExperienceArchiveNo(-1);
    setMessage("");
    const response = await fetch("/api/experiences", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        title: "新しい実験",
        summary: "実験メモを入力してください。",
        category: "prototype",
        tags: [],
        playUrl: "",
        status: "wip",
        featured: false,
        relatedPostIds: [],
      })
    });
    const data = await response.json();
    setSavingExperienceArchiveNo(null);

    if (!response.ok) {
      setMessage(data.message || "実験を作成できませんでした。");
      return;
    }

    setExperiences((items) => [...items, data]);
    setMessage("新しい実験を作成しました。");
  }

  async function deleteExperience(experience: AdminExperience) {
    if (!window.confirm(`「${experience.title}」を削除します。公開ページの実験室からカードが消えます。よろしいですか？`)) return;
    setSavingExperienceArchiveNo(experience.archiveNo);
    setMessage("");
    const response = await fetch("/api/experiences", {
      method: "DELETE",
      headers: jsonHeaders,
      body: JSON.stringify({ archiveNo: experience.archiveNo })
    });
    const data = await response.json();
    setSavingExperienceArchiveNo(null);

    if (!response.ok) {
      setMessage(data.message || "実験を削除できませんでした。");
      return;
    }

    setExperiences((items) => items.filter((item) => item.archiveNo !== experience.archiveNo));
    setMessage("実験を削除しました。");
  }

  function toggleExperienceRelatedPost(experience: AdminExperience, postId: string) {
    const ids = relatedPostIdsForExperience(experience);
    const next = ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId];
    updateExperienceDraft(experience.archiveNo, { relatedPostIds: next, relatedPostId: undefined });
  }

  function moveExperienceRelatedPost(experience: AdminExperience, postId: string, direction: -1 | 1) {
    const ids = relatedPostIdsForExperience(experience);
    const index = ids.indexOf(postId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
    const next = [...ids];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateExperienceDraft(experience.archiveNo, { relatedPostIds: next, relatedPostId: undefined });
  }

  function experimentsForPost(postId: string) {
    return experiences.filter((experience) => relatedPostIdsForExperience(experience).includes(postId));
  }

  async function setPostExperienceRelation(experience: AdminExperience, postId: string, shouldLink: boolean) {
    const ids = relatedPostIdsForExperience(experience);
    const nextIds = shouldLink ? [...new Set([...ids, postId])] : ids.filter((id) => id !== postId);
    const nextExperience = { ...experience, relatedPostIds: nextIds, relatedPostId: undefined };
    updateExperienceDraft(experience.archiveNo, { relatedPostIds: nextIds, relatedPostId: undefined });
    await saveExperience(nextExperience);
  }

  function duplicateRelationOwner(experience: AdminExperience, postId: string) {
    return experiences.find((item) => item.archiveNo !== experience.archiveNo && relatedPostIdsForExperience(item).includes(postId));
  }

  function updateSiteUpdateDraft(patch: Partial<SiteUpdate>) {
    setSiteUpdateDraft((draft) => ({ ...draft, ...patch }));
  }

  async function saveSiteUpdate() {
    setSavingSiteUpdate(true);
    setMessage("");
    const response = await fetch("/api/site-updates", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(siteUpdateDraft)
    });
    const data = await response.json();
    setSavingSiteUpdate(false);

    if (!response.ok) {
      setMessage(data.message || "更新履歴を保存できませんでした。");
      return;
    }

    setSiteUpdates((items) => [data, ...items].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)));
    setSiteUpdateDraft({ id: "", date: todayInputDate(), title: "", href: "/" });
    setMessage("更新履歴を追加しました。");
  }

  async function deleteSiteUpdate(update: SiteUpdate) {
    if (!window.confirm(`「${update.title}」を更新履歴から削除します。よろしいですか？`)) return;
    setSavingSiteUpdate(true);
    setMessage("");
    const response = await fetch("/api/site-updates", {
      method: "DELETE",
      headers: jsonHeaders,
      body: JSON.stringify({ id: update.id })
    });
    const data = await response.json();
    setSavingSiteUpdate(false);

    if (!response.ok) {
      setMessage(data.message || "更新履歴を削除できませんでした。");
      return;
    }

    setSiteUpdates((items) => items.filter((item) => item.id !== update.id));
    setMessage("更新履歴を削除しました。");
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
    setTagDraft(formatTagText(data));
    setLinkDraft(formatLinkText(data));
    setPublicPath(status === "public" ? `/read/${data.id}` : "");
    await reloadPosts();
    setMessage(status === "public" ? "公開しました。Xで宣伝しますか？" : "下書きを保存しました。");
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
    setTagDraft(formatTagText(nextCurrent));
    setLinkDraft(formatLinkText(nextCurrent));
    setPublicPath(nextCurrent.status === "public" ? `/read/${nextCurrent.id}` : "");
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

  const keepBodySelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    rememberBodySelection();
  };

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
    const shareDisabled = !canSharePost(post);
    return (
      <article key={post.id} className={active ? "logCard active" : "logCard"}>
        <button className="logMain" type="button" onClick={() => selectPost(post)}>
          <span className={dense ? "logThumb dense" : "logThumb"}>
            {post.thumbnail ? <img src={post.thumbnail} alt="" /> : <span className="thumbFallback">AI</span>}
          </span>
          <span className="logText">
            <strong>{postTitle(post)}</strong>
            <small>{postSummary(post)}</small>
            <span className="metaRow">
              <span className={post.status === "public" ? "miniStatus public" : "miniStatus draft"}>{post.status === "public" ? "公開" : "下書き"}</span>
              <span>{postAuthor(post).name}</span>
              <span>{postCategories(post).join(" / ") || "未分類"}</span>
              <span>更新: {formatRelative(post.updatedAt)}</span>
            </span>
            {post.tags?.length ? (
              <span className="tagLine">{post.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}</span>
            ) : null}
          </span>
        </button>
        <details className="logMenu">
          <summary aria-label={`${postTitle(post)}のメニュー`}>…</summary>
          <div>
            <button type="button" onClick={() => selectPost(post)}>編集</button>
            <a href={`/read/${post.id}`} target="_blank" rel="noreferrer" aria-disabled={post.status !== "public"}>プレビュー</a>
            <button type="button" disabled={shareDisabled} onClick={() => openTweetIntent(post)}>X投稿を作成</button>
            <button type="button" disabled={shareDisabled} onClick={() => void copyTweet(post)}>コピー</button>
          </div>
        </details>
      </article>
    );
  }

  function renderTweetPreview() {
    return (
      <section className="tweetPreview">
        <div>
          <h3>X投稿プレビュー</h3>
          <p>{currentCanShare ? "公開ページURLを添えて投稿を作成できます。" : "公開済みの記事で使えます。"}</p>
        </div>
        <pre>{currentCopyText}</pre>
        <div className="tweetActions">
          <button className="tweetButton" type="button" disabled={!currentCanShare} onClick={() => openTweetIntent()}>
            X投稿を作成
          </button>
          <button className="copyButton" type="button" disabled={!currentCanShare} onClick={() => void copyTweet()}>
            投稿文をコピー
          </button>
        </div>
      </section>
    );
  }

  function renderExperimentSettings() {
    return (
      <section className="experimentSettings">
        <div className="settingsSectionHeader">
          <h2>実験カード</h2>
          <p>公開ページの実験室カードを編集します。指定サムネが空の場合は、先頭の関連ログのサムネを自動で使います。</p>
          <button className="primaryButton" type="button" disabled={savingExperienceArchiveNo === -1} onClick={() => void createExperience()}>
            ＋ 実験を追加
          </button>
        </div>
        <div className="experimentSettingsList">
          {[...experiences].sort((a, b) => a.archiveNo - b.archiveNo).map((experience) => {
            const autoThumbnail = resolveAutoExperimentThumbnail(experience);
            const selectedThumbnail = experience.labThumbnail ?? "";
            const previewThumbnail = selectedThumbnail || autoThumbnail;
            const relatedIds = relatedPostIdsForExperience(experience);
            const relatedPosts = relatedIds.map((id) => posts.find((post) => post.id === id)).filter((post): post is Post => Boolean(post));
            const availablePosts = posts
              .filter((post) => {
                const q = `${post.title} ${post.summary} ${(post.tags ?? []).join(" ")}`.toLowerCase();
                return !query.trim() || q.includes(query.trim().toLowerCase());
              })
              .slice(0, 18);
            return (
              <article className="experimentSettingCard" key={experience.archiveNo}>
                <div className="experimentSettingThumb">
                  {previewThumbnail ? <img src={previewThumbnail} alt="" /> : <span>NO IMAGE</span>}
                  <em>{resolvedExperimentThumbnailLabel(experience)}</em>
                </div>
                <div className="experimentSettingBody">
                  <header className="experimentSettingHeader">
                    <small>DEST-{String(experience.archiveNo).padStart(3, "0")}</small>
                    <label className="switchRow">
                      <input
                        type="checkbox"
                        checked={Boolean(experience.featured)}
                        onChange={(event) => updateExperienceDraft(experience.archiveNo, { featured: event.target.checked })}
                      />
                      注目の実験
                    </label>
                  </header>
                  <label>
                    タイトル
                    <input value={experience.title} onChange={(event) => updateExperienceDraft(experience.archiveNo, { title: event.target.value })} />
                  </label>
                  <label>
                    概要
                    <textarea value={experience.summary} rows={3} onChange={(event) => updateExperienceDraft(experience.archiveNo, { summary: event.target.value })} />
                  </label>
                  <div className="metaSelectGrid">
                    <label>
                      カテゴリ
                      <select value={experience.category} onChange={(event) => updateExperienceDraft(experience.archiveNo, { category: event.target.value })}>
                        {experimentCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>
                      状態
                      <select value={experience.status ?? "wip"} onChange={(event) => updateExperienceDraft(experience.archiveNo, { status: event.target.value as AdminExperience["status"] })}>
                        <option value="live">公開中</option>
                        <option value="wip">調整中</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    タグ
                    <input value={(experience.tags ?? []).map((tag) => `#${tag}`).join(" ")} onChange={(event) => updateExperienceDraft(experience.archiveNo, { tags: splitTags(event.target.value) })} />
                  </label>
                  <label>
                    起動URL
                    <input value={experience.playUrl ?? ""} onChange={(event) => updateExperienceDraft(experience.archiveNo, { playUrl: event.target.value })} placeholder="https://..." />
                  </label>
                  <label>
                    指定サムネ
                    <select
                      value={selectedThumbnail}
                      onChange={(event) => updateExperienceDraft(experience.archiveNo, { labThumbnail: event.target.value })}
                    >
                      <option value="">自動（先頭関連ログのサムネ）</option>
                      {thumbnailOptions.map((post) => (
                        <option key={post.id} value={post.thumbnail}>
                          {postTitle(post)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    直接指定
                    <input
                      value={selectedThumbnail}
                      onChange={(event) => updateExperienceDraft(experience.archiveNo, { labThumbnail: event.target.value })}
                      placeholder="/uploads/.../thumbnail.webp"
                    />
                  </label>
                  <section className="relationPicker">
                    <div>
                      <h3>関連ログ</h3>
                      <p>選択順が公開側の導線順です。指定サムネが空の場合、先頭ログのサムネが実験カード画像に使われます。</p>
                    </div>
                    {relatedPosts.length ? (
                      <div className="selectedRelations">
                        {relatedPosts.map((post) => {
                          const owner = duplicateRelationOwner(experience, post.id);
                          return (
                            <div className="relationChip" key={post.id}>
                              <span>{postTitle(post)}</span>
                              <button type="button" onClick={() => moveExperienceRelatedPost(experience, post.id, -1)}>↑</button>
                              <button type="button" onClick={() => moveExperienceRelatedPost(experience, post.id, 1)}>↓</button>
                              <button type="button" onClick={() => toggleExperienceRelatedPost(experience, post.id)}>外す</button>
                              {owner ? <small>資料室の逆引きは先勝ちのため「{owner.title}」側が優先されます</small> : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="emptyState">関連ログは未設定です。</p>}
                    <div className="relationPostList">
                      {availablePosts.map((post) => {
                        const active = relatedIds.includes(post.id);
                        return (
                          <button className={active ? "active" : ""} type="button" key={post.id} onClick={() => toggleExperienceRelatedPost(experience, post.id)}>
                            {post.thumbnail ? <img src={post.thumbnail} alt="" /> : null}
                            <span>{postTitle(post)}<small>{post.tags?.slice(0, 3).map((tag) => `#${tag}`).join(" ")}</small></span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <div className="experimentSettingActions">
                    <button
                      type="button"
                      disabled={savingExperienceArchiveNo === experience.archiveNo}
                      onClick={() => void saveExperience(experience)}
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      disabled={savingExperienceArchiveNo === experience.archiveNo || !selectedThumbnail}
                      onClick={() => updateExperienceDraft(experience.archiveNo, { labThumbnail: "" })}
                    >
                      自動に戻す
                    </button>
                    <button className="deleteButton" type="button" disabled={savingExperienceArchiveNo === experience.archiveNo} onClick={() => void deleteExperience(experience)}>
                      削除
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderSiteUpdateSettings() {
    const linkOptions = [
      { label: "トップページ", href: "/" },
      { label: "実験室", href: "/experiments" },
      { label: "資料室", href: "/read" },
      { label: "ラボ案内", href: "/about" },
      ...experiences.map((experience) => ({
        label: `実験: ${experience.title}`,
        href: `/experiments#DEST-${String(experience.archiveNo).padStart(3, "0")}`
      })),
      ...posts
        .filter((post) => post.status === "public")
        .slice(0, 24)
        .map((post) => ({
          label: `記事: ${postTitle(post)}`,
          href: `/read/${post.id}`
        }))
    ];

    return (
      <section className="siteUpdateSettings">
        <div className="settingsSectionHeader">
          <h2>トップページ更新情報</h2>
          <p>記事公開や実験追加など、トップに載せたい更新だけを登録します。トップページには直近5件だけ表示されます。</p>
        </div>
        <div className="siteUpdateForm">
          <label>
            日付
            <input
              type="date"
              value={displayDateToInputDate(siteUpdateDraft.date)}
              onChange={(event) => updateSiteUpdateDraft({ date: event.target.value })}
            />
          </label>
          <label>
            タイトル
            <input
              value={siteUpdateDraft.title}
              onChange={(event) => updateSiteUpdateDraft({ title: event.target.value })}
              placeholder="例：実験室に新しい実験を追加しました。"
            />
          </label>
          <label>
            リンク候補
            <select value="" onChange={(event) => updateSiteUpdateDraft({ href: event.target.value })}>
              <option value="">候補から選ぶ</option>
              {linkOptions.map((option) => (
                <option key={`${option.href}-${option.label}`} value={option.href}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            リンク先
            <input
              value={siteUpdateDraft.href}
              onChange={(event) => updateSiteUpdateDraft({ href: event.target.value })}
              placeholder="/read/article-id"
            />
          </label>
          <button className="primaryButton" type="button" disabled={savingSiteUpdate} onClick={() => void saveSiteUpdate()}>
            更新履歴に追加
          </button>
        </div>
        <div className="siteUpdateList">
          {siteUpdates.map((update, index) => (
            <article className="siteUpdateRow" key={update.id}>
              <time dateTime={update.date.replaceAll(".", "-")}>{update.date}</time>
              <div>
                <strong>{update.title}</strong>
                <a href={update.href} target="_blank" rel="noreferrer">{update.href}</a>
                {index < 5 ? <small>トップ表示中</small> : null}
              </div>
              <button className="deleteButton" type="button" disabled={savingSiteUpdate} onClick={() => void deleteSiteUpdate(update)}>
                削除
              </button>
            </article>
          ))}
          {!siteUpdates.length ? <p className="emptyState">更新履歴はまだありません。</p> : null}
        </div>
      </section>
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

  function renderArticlePreview() {
    const status = postResultStatus(current);
    return (
      <div className="previewBox articlePreview">
        <p className="archive-article__eyebrow">{postCategories(current).join(" / ")}</p>
        <h2>{postTitle(current)}</h2>
        <div className="previewMeta">
          <span>担当：{postAuthor(current).name}</span>
          <span>資料室分類：{current.logCategory ?? "開発ログ"}</span>
          <span>Status：{status.label}</span>
        </div>
        <p>{current.summary}</p>
        {current.thumbnail ? <img className="articlePreviewHero" src={current.thumbnail} alt="" /> : null}
        <div className="articlePreviewInfo">
          <img src={status.image} alt="" />
          <span>{postExperimentResult(current)}</span>
        </div>
        <EmbeddedMarkdown html={markdownToHtml(current.body || "本文なし。画像だけの投稿もOKです。")} />
        {current.tags?.length ? <div className="tagLine">{current.tags.map((tag) => <em key={tag}>#{tag}</em>)}</div> : null}
        {current.links.length ? (
          <div className="archive-links__items">
            {current.links.map((link) => <a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
          </div>
        ) : null}
      </div>
    );
  }

  function renderPostExperimentRelations() {
    const linkedExperiments = experimentsForPost(current.id);
    return (
      <section className="formSection relationEditor">
        <h3>実験との紐付け</h3>
        <p className="fieldHelp">この記事を参照している実験を表示します。変更は記事ではなく実験側の relatedPostIds に即時保存されます。</p>
        {linkedExperiments.length ? (
          <div className="selectedRelations">
            {linkedExperiments.map((experience) => (
              <div className="relationChip" key={experience.archiveNo}>
                <span>{experience.title}</span>
                <button type="button" disabled={savingExperienceArchiveNo === experience.archiveNo} onClick={() => void setPostExperienceRelation(experience, current.id, false)}>
                  外す
                </button>
              </div>
            ))}
          </div>
        ) : <p className="emptyState">まだ実験には紐付いていません。</p>}
        <div className="relationPostList compact">
          {experiences.map((experience) => {
            const active = relatedPostIdsForExperience(experience).includes(current.id);
            return (
              <button className={active ? "active" : ""} type="button" key={experience.archiveNo} disabled={savingExperienceArchiveNo === experience.archiveNo} onClick={() => void setPostExperienceRelation(experience, current.id, !active)}>
                <span>{experience.title}<small>{active ? "紐付け中" : "クリックで紐付け"}</small></span>
              </button>
            );
          })}
        </div>
      </section>
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
          <div className="adminEditorWorkbench">
          <div className="editorForm">
            <section className="formSection">
              <h3>基本情報</h3>
              <div className="metaSelectGrid desktopMetaFields">
                <label>ステータス<select value={current.status} onChange={(event) => update("status", event.target.value as Post["status"])}>
                  <option value="draft">下書き</option>
                  <option value="public">公開済み</option>
                </select></label>
                <label>担当<select value={current.author} onChange={(event) => update("author", event.target.value as AuthorId)}>
                  {authorProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select></label>
                <label>Result Status<select value={current.resultStatus} onChange={(event) => update("resultStatus", event.target.value as ResultStatusId)}>
                  {resultStatuses.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select></label>
              </div>
              <label>ID<input value={current.id} onChange={(event) => update("id", event.target.value)} disabled={currentExists} /></label>
              <label>タイトル<input value={current.title} onChange={(event) => update("title", event.target.value)} placeholder="画像だけなら空でもOK" /></label>
              <label>ひとこと<textarea value={current.summary} onChange={(event) => update("summary", event.target.value)} rows={3} /></label>
              <label>実験結果<textarea value={current.experimentResult} onChange={(event) => update("experimentResult", event.target.value)} rows={2} placeholder="例：大成功。画像生成から実装まで一気通貫で確認できた。" /></label>
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
              <label>資料室の分類<select value={current.logCategory ?? "開発ログ"} onChange={(event) => update("logCategory", event.target.value as ResearchLogCategory)}>
                {researchLogCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select></label>
              <p className="fieldHelp">上のカテゴリは活動分野です。資料室の分類は `/read` のフィルタに使われます。</p>
              <label>タグ<input value={tagDraft} onChange={(event) => setTagText(event.target.value)} placeholder="#スマホ #実験 #アイデア" /></label>
            </section>

            <section className="formSection">
              <h3>資料室掲載</h3>
              <p className="fieldHelp">公開済みにすると資料室の研究記録に表示されます。トップページのピックアップ枠は新デザインでは使っていません。</p>
              <p className="fieldHelp">ピン留めは管理画面内の整理用です。公開ページには出ません。</p>
              <p className="fieldHelp">Result Status は資料室リストでは「成功」「失敗」以外は「調整中」に丸めて表示されます（記事ページでは5種そのまま表示）。</p>
              <div className="adminInfoGrid">
                <span>一覧: /read</span>
                <span>個別: /read/{current.id || "記事ID"}</span>
              </div>
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
                      <button type="button" onMouseDown={keepBodySelection} onClick={() => insertMarkdownImage(current.thumbnail)}>本文に挿入</button>
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
                        <button type="button" onMouseDown={keepBodySelection} onClick={() => insertMarkdownImage(image)}>挿入</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="formSection">
              <h3>本文 Markdown</h3>
              <div className="markdownToolbar" aria-label="Markdown ツールバー">
                <button type="button" onMouseDown={keepBodySelection} onClick={() => prefixSelectedLines("## ", "見出し")}>H2</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => prefixSelectedLines("### ", "小見出し")}>H3</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => wrapSelection("**", "**", "太字")}>B</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => prefixSelectedLines("- ", "項目")}>List</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => prefixSelectedLines("> ", "引用")}>Quote</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => wrapSelection("[", "](https://example.com)", "リンク名")}>Link</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={insertHorizontalLine}>Line</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => wrapSelection("`", "`", "ここにコード")}>Code</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => wrapSelection("```\n", "\n```", "ここにコード", true)}>CodeBlock</button>
                <button type="button" onMouseDown={keepBodySelection} onClick={() => wrapSelection(":::note\n", "\n:::", "補足：ここに気になる人向けの説明を書く", true)}>Note</button>
              </div>
              <textarea
                ref={bodyRef}
                className="bodyInput"
                value={current.body}
                onBlur={rememberBodySelection}
                onClick={rememberBodySelection}
                onKeyUp={rememberBodySelection}
                onSelect={rememberBodySelection}
                onScroll={rememberBodySelection}
                onChange={(event) => {
                  update("body", event.target.value);
                  rememberBodySelection();
                }}
                rows={12}
              />
            </section>

            <section className="formSection">
              <h3>関連リンク</h3>
              <textarea value={linkText()} onChange={(event) => setLinkText(event.target.value)} rows={4} placeholder="ラベル,https://example.com" />
            </section>
            {renderPostExperimentRelations()}
          </div>
          <aside className="desktopArticlePreview" aria-label="公開ページプレビュー">
            {renderArticlePreview()}
          </aside>
          </div>
        ) : null}

        {editorTab === "preview" ? (
          renderArticlePreview()
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
        {renderTweetPreview()}

        <div className="editorActions">
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
          <h1>{view === "editor" ? "編集" : view === "logs" ? "ログ一覧" : view === "experiments" ? "実験室" : view === "settings" ? "設定" : "完成してなくてOK。"}</h1>
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
            <button className={view === "experiments" ? "active" : ""} type="button" onClick={() => setView("experiments")}>実験室 <span>{experiences.length}</span></button>
            <button className={view === "settings" ? "active" : ""} type="button" onClick={() => setView("settings")}>設定</button>
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

        <section className="adminExperiments">
          <div className="settingsSectionHeader">
            <h1>実験室</h1>
            <p>実験室カードに使う画像を管理します。空欄の場合は関連記事のサムネを自動で使います。</p>
          </div>
          {renderExperimentSettings()}
        </section>

        <section className="adminSettings">
          <h1>設定</h1>
          <p>現在はローカル JSON / GitHub-backed storage で投稿を保存します。画像は投稿 ID ごとに `/public/uploads/` へ保存されます。</p>
          <div className="settingsStats">
            <span>全ログ: {posts.length}</span>
            <span>下書き: {stats.drafts.length}</span>
            <span>公開済み: {stats.publicPosts.length}</span>
            <span>ピン留め: {stats.pinned.length}</span>
            <span>更新履歴: {siteUpdates.length}</span>
          </div>
          {renderSiteUpdateSettings()}
          <button className="secondaryButton" type="button" onClick={logout}>ログアウト</button>
        </section>
      </div>

      <nav className="bottomNav" aria-label="admin mobile navigation">
        <button className={view === "home" ? "active" : ""} type="button" onClick={() => setView("home")}>ホーム</button>
        <button className={view === "logs" ? "active" : ""} type="button" onClick={() => setView("logs")}>ログ一覧</button>
        <button className={view === "editor" ? "active" : ""} type="button" onClick={startNewPost}>書く</button>
        <button className={view === "experiments" ? "active" : ""} type="button" onClick={() => setView("experiments")}>実験室</button>
        <button className={view === "settings" ? "active" : ""} type="button" onClick={() => setView("settings")}>設定</button>
      </nav>
    </main>
  );
}
