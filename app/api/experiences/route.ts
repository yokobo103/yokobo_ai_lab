import { NextRequest, NextResponse } from "next/server";
import {
  getExperienceRelatedPostIds,
  normalizeAdminExperienceCategory,
  normalizeAdminExperienceUrl,
  normalizeLabThumbnail,
  normalizeStringList,
  readAdminExperiences,
  writeAdminExperiences,
  type AdminExperience
} from "@/lib/admin-experiences";
import { isAdminPassword, readPosts } from "@/lib/posts";

export const runtime = "nodejs";

const authError = { message: "パスワードが違います。再ログインしてください" };

export async function GET(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  return NextResponse.json(await readAdminExperiences());
}

export async function PATCH(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const archiveNo = Number(input.archiveNo);
  if (!Number.isFinite(archiveNo)) {
    return NextResponse.json({ message: "実験番号が不正です。" }, { status: 400 });
  }

  const experiences = await readAdminExperiences();
  const index = experiences.findIndex((experience) => experience.archiveNo === archiveNo);
  if (index === -1) {
    return NextResponse.json({ message: "実験が見つかりません。" }, { status: 404 });
  }

  const normalized = await normalizeExperiencePatch(input, experiences[index]);
  if ("message" in normalized) return NextResponse.json({ message: normalized.message }, { status: 400 });

  experiences[index] = {
    ...normalized,
  };

  await writeAdminExperiences(experiences);
  return NextResponse.json(experiences[index]);
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const experiences = await readAdminExperiences();
  const archiveNo = Math.max(0, ...experiences.map((experience) => Number(experience.archiveNo) || 0)) + 1;
  const base: AdminExperience = {
    archiveNo,
    title: "",
    category: "prototype",
    summary: "",
    thumbnail: "",
    tags: [],
    playUrl: "",
    status: "wip",
    addedAt: new Date().toISOString().slice(0, 10),
  };
  const normalized = await normalizeExperiencePatch({ ...input, archiveNo }, base);
  if ("message" in normalized) return NextResponse.json({ message: normalized.message }, { status: 400 });

  const next = [...experiences, normalized];
  await writeAdminExperiences(next);
  return NextResponse.json(normalized);
}

export async function DELETE(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const archiveNo = Number(input.archiveNo);
  if (!Number.isFinite(archiveNo)) {
    return NextResponse.json({ message: "実験番号が不正です。" }, { status: 400 });
  }

  const experiences = await readAdminExperiences();
  const next = experiences.filter((experience) => experience.archiveNo !== archiveNo);
  if (next.length === experiences.length) {
    return NextResponse.json({ message: "実験が見つかりません。" }, { status: 404 });
  }

  await writeAdminExperiences(next);
  return NextResponse.json({ ok: true });
}

async function normalizeExperiencePatch(input: Record<string, unknown>, previous: AdminExperience): Promise<AdminExperience | { message: string }> {
  const title = typeof input.title === "string" ? input.title.trim() : previous.title;
  if (!title) return { message: "実験タイトルを入力してください。" };

  const category = input.category === undefined ? previous.category : normalizeAdminExperienceCategory(input.category);
  if (!category) return { message: "実験カテゴリが不正です。" };

  const status = input.status === undefined ? previous.status : input.status;
  if (status !== "live" && status !== "wip") return { message: "実験ステータスが不正です。" };

  const labThumbnail = input.labThumbnail === undefined ? previous.labThumbnail : normalizeLabThumbnail(input.labThumbnail);
  if (input.labThumbnail && !labThumbnail) {
    return { message: "サムネイルURLは / から始まるパス、または http(s) URL を指定してください。" };
  }

  const playUrl = input.playUrl === undefined ? previous.playUrl : normalizeAdminExperienceUrl(input.playUrl);
  if (input.playUrl && !playUrl) {
    return { message: "起動URLは / から始まるパス、または http(s) URL を指定してください。" };
  }

  const posts = await readPosts();
  const postIds = new Set(posts.map((post) => post.id));
  const requestedRelatedPostIds = input.relatedPostIds === undefined ? getExperienceRelatedPostIds(previous) : normalizeStringList(input.relatedPostIds, 24);
  const relatedPostIds = requestedRelatedPostIds.filter((id) => postIds.has(id));
  if (requestedRelatedPostIds.length !== relatedPostIds.length) {
    return { message: "存在しない投稿IDが関連ログに含まれています。" };
  }

  return {
    ...previous,
    title,
    category,
    summary: typeof input.summary === "string" ? input.summary.trim() : previous.summary,
    tags: input.tags === undefined ? normalizeStringList(previous.tags) : normalizeStringList(input.tags),
    playUrl: playUrl || undefined,
    status,
    featured: input.featured === undefined ? previous.featured : Boolean(input.featured),
    labThumbnail: labThumbnail || undefined,
    relatedPostIds,
    relatedPostId: undefined,
  };
}
