import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword, normalizePost, readPosts, validatePost, writePosts } from "@/lib/posts";

export const runtime = "nodejs";

const authError = { message: "パスワードが違います。再ログインしてください" };

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const { id } = await params;
  const posts = await readPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "投稿が見つかりません。" }, { status: 404 });
  }

  const input = await request.json();
  const post = normalizePost({ ...input, id }, posts[index]);
  const error = validatePost(post);
  if (error) return NextResponse.json({ message: error }, { status: 400 });

  posts[index] = post;
  await writePosts(posts);
  return NextResponse.json(post);
}
