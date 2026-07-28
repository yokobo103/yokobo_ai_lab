import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword } from "@/lib/posts";
import { mergeEntry, normalizeEntry, readLog, writeLog } from "@/lib/promo-log";

export const runtime = "nodejs";

const authError = { message: "パスワードが違います。再ログインしてください" };
const readError = { message: "記録を読めませんでした。少し待ってからお試しください" };

export async function GET(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  try {
    return NextResponse.json(await readLog());
  } catch {
    return NextResponse.json(readError, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const entry = normalizeEntry(await request.json());
  if ("message" in entry) return NextResponse.json({ message: entry.message }, { status: 400 });

  // 読めないまま書くと過去の記録を消す。プリセットと同じ扱い。
  let entries: Awaited<ReturnType<typeof readLog>>;
  try {
    entries = await readLog();
  } catch {
    return NextResponse.json(readError, { status: 503 });
  }

  const next = mergeEntry(entries, entry);
  await writeLog(next);
  return NextResponse.json(next);
}
