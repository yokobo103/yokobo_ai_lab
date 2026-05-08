import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ReactionResponse = {
  count: number;
};

const missingEnvError = { message: "Upstash Redisの環境変数が設定されていません。" };

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

function normalizePostId(value: string | null | undefined) {
  const postId = value?.trim();
  return postId || null;
}

function getPawKey(postId: string) {
  return `paw:count:${postId}`;
}

export async function GET(request: NextRequest) {
  const postId = normalizePostId(request.nextUrl.searchParams.get("postId"));
  if (!postId) {
    return NextResponse.json({ message: "postIdが必要です。" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(missingEnvError, { status: 500 });
  }

  try {
    const value = await redis.get<number | string>(getPawKey(postId));
    const count = typeof value === "number" ? value : Number(value ?? 0);
    return NextResponse.json<ReactionResponse>({ count: Number.isFinite(count) ? count : 0 });
  } catch {
    return NextResponse.json({ message: "肉球数を取得できませんでした。" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: { postId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON bodyが必要です。" }, { status: 400 });
  }

  const postId = normalizePostId(typeof body.postId === "string" ? body.postId : null);
  if (!postId) {
    return NextResponse.json({ message: "postIdが必要です。" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(missingEnvError, { status: 500 });
  }

  try {
    const count = await redis.incr(getPawKey(postId));
    return NextResponse.json<ReactionResponse>({ count });
  } catch {
    return NextResponse.json({ message: "肉球数を更新できませんでした。" }, { status: 500 });
  }
}
