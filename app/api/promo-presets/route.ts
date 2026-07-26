import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword } from "@/lib/posts";
import { normalizePreset, readPresets, writePresets } from "@/lib/promo-presets";

export const runtime = "nodejs";

const authError = { message: "パスワードが違います。再ログインしてください" };

const readError = { message: "保存済みのプリセットを読めませんでした。少し待ってからお試しください" };

export async function GET(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  try {
    return NextResponse.json(await readPresets());
  } catch {
    return NextResponse.json(readError, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const preset = normalizePreset(await request.json());
  if ("message" in preset) return NextResponse.json({ message: preset.message }, { status: 400 });

  // 既存を読めないまま保存すると、他のプリセットを消してしまう。
  let presets: Awaited<ReturnType<typeof readPresets>>;
  try {
    presets = await readPresets();
  } catch {
    return NextResponse.json(readError, { status: 503 });
  }

  // 同じ名前で保存し直したら上書きする。同名が増えるとスマホでは選びにくい。
  const next = [preset, ...presets.filter((item) => item.name !== preset.name)];
  await writePresets(next);

  return NextResponse.json(next);
}

export async function DELETE(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const id = typeof input.id === "string" ? input.id : "";
  if (!id) return NextResponse.json({ message: "プリセットIDが不正です。" }, { status: 400 });

  let presets: Awaited<ReturnType<typeof readPresets>>;
  try {
    presets = await readPresets();
  } catch {
    return NextResponse.json(readError, { status: 503 });
  }

  const next = presets.filter((item) => item.id !== id);
  if (next.length === presets.length) {
    return NextResponse.json({ message: "プリセットが見つかりません。" }, { status: 404 });
  }

  await writePresets(next);
  return NextResponse.json(next);
}
