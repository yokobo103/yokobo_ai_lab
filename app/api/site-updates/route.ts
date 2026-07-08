import { NextRequest, NextResponse } from "next/server";
import { normalizeSiteUpdate, readSiteUpdates, writeSiteUpdates } from "@/lib/admin-site-updates";
import { isAdminPassword } from "@/lib/posts";

export const runtime = "nodejs";

const authError = { message: "パスワードが違います。再ログインしてください" };

export async function GET(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  return NextResponse.json(await readSiteUpdates());
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const update = normalizeSiteUpdate(input);
  if ("message" in update) return NextResponse.json({ message: update.message }, { status: 400 });

  const updates = await readSiteUpdates();
  if (updates.some((item) => item.id === update.id)) {
    return NextResponse.json({ message: "同じIDの更新履歴があります。" }, { status: 409 });
  }

  await writeSiteUpdates([update, ...updates]);
  return NextResponse.json(update);
}

export async function DELETE(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const input = await request.json();
  const id = typeof input.id === "string" ? input.id : "";
  if (!id) return NextResponse.json({ message: "更新履歴IDが不正です。" }, { status: 400 });

  const updates = await readSiteUpdates();
  const next = updates.filter((item) => item.id !== id);
  if (next.length === updates.length) {
    return NextResponse.json({ message: "更新履歴が見つかりません。" }, { status: 404 });
  }

  await writeSiteUpdates(next);
  return NextResponse.json({ ok: true });
}
