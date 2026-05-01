import Image from "next/image";
import Link from "next/link";
import { filterPostsByLogCategory, getLogCategoryLabel, logCategoryLinks } from "@/lib/log-categories";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "../site-chrome";

type PostListPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export async function PostListPage({ searchParams }: PostListPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCategory = params?.category;
  const allPosts = (await readPosts()).filter((post) => post.status === "public");
  const posts = filterPostsByLogCategory(allPosts, selectedCategory);
  const selectedLabel = getLogCategoryLabel(selectedCategory);

  return (
    <>
      <SiteHeader active="posts" />
      <main className="section-shell pageTop">
        <div className="sectionTitle">
          <p className="eyebrow">研究ログ</p>
          <h1>よこぼのあそび倉庫</h1>
          <p>
            公開中のAI実験、画像生成、ゲーム制作、3D、失敗ログ、気づきメモです。
            {selectedLabel ? `いまは「${selectedLabel}」を表示しています。` : ""}
          </p>
        </div>

        <nav className="logFilterPills" aria-label="研究ログのカテゴリ">
          {logCategoryLinks.map((category) => (
            <Link
              className={`logFilterPill${category.slug === selectedCategory || (!selectedCategory && category.slug === "all") ? " active" : ""}${"warm" in category ? " warm" : ""}`}
              href={category.href}
              key={category.slug}
            >
              <Image src={category.icon} alt="" width={24} height={24} />
              {category.label}
            </Link>
          ))}
        </nav>

        {posts.length > 0 ? (
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
        ) : (
          <div className="emptyLogState">
            <h2>このテーマのログはまだ準備中です。</h2>
            <p>ほかのテーマをのぞくか、ぜんぶのログを見てみてください。</p>
            <Link className="aboutButton" href="/logs">ぜんぶみる</Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
