import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword, normalizePost, readPosts, validatePost, writePosts } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const admin = isAdminPassword(request.headers.get("x-admin-password"));
  const posts = await readPosts();
  return NextResponse.json(admin ? posts : posts.filter((post) => post.status === "public"));
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ message: "パスワードが違います。" }, { status: 401 });
  }

  const input = await request.json();
  const posts = await readPosts();
  const post = normalizePost(input);
  const error = validatePost(post);
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  if (posts.some((item) => item.id === post.id)) {
    return NextResponse.json({ message: "同じIDの投稿があります。" }, { status: 409 });
  }

  await writePosts([post, ...posts]);
  return NextResponse.json(post);
}
