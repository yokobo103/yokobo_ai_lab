import Image from "next/image";
import Link from "next/link";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "../site-chrome";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = (await readPosts()).filter((post) => post.status === "public");

  return (
    <>
      <SiteHeader />
      <main className="section-shell pageTop">
        <div className="sectionTitle">
          <p className="eyebrow">研究ログ</p>
          <h1>よこぼのあそび倉庫</h1>
          <p>公開中のAI実験、画像生成、ゲーム制作、3D、失敗ログ、気づきメモです。</p>
        </div>
        <div className="postGrid wide">
          {posts.map((post) => (
            <Link className="postCard" href={`/posts/${post.id}`} key={post.id}>
              <div className="postThumb">
                {post.thumbnail ? <Image src={post.thumbnail} alt="" fill sizes="(max-width: 720px) 100vw, 320px" /> : null}
              </div>
              <span className="chip">{post.category}</span>
              <h2>{post.title || "無題のあそび"}</h2>
              <p>{post.summary || "画像を置いたら、もう投稿。"}</p>
              <div className="tagRow">
                {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
