import Image from "next/image";
import Link from "next/link";
import { filterPostsByLogCategory, getLogCategoryLabel, getPostCategories, logCategoryLinks } from "@/lib/log-categories";
import { readPosts } from "@/lib/posts";
import { SiteFooter, SiteHeader } from "../site-chrome";

type PostListPageProps = {
  searchParams?: Promise<{ category?: string; q?: string }>;
};

export async function PostListPage({ searchParams }: PostListPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedCategory = params?.category;
  const query = params?.q?.trim() ?? "";
  const allPosts = (await readPosts()).filter((post) => post.status === "public");
  const categoryPosts = filterPostsByLogCategory(allPosts, selectedCategory);
  const normalizedQuery = query.toLocaleLowerCase();
  const posts = normalizedQuery
    ? categoryPosts.filter((post) => {
        const haystack = [
          post.title,
          post.summary,
          post.body,
          ...getPostCategories(post),
          ...post.links.flatMap((link) => [link.label, link.url])
        ].join(" ").toLocaleLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : categoryPosts;
  const selectedLabel = getLogCategoryLabel(selectedCategory);

  return (
    <>
      <SiteHeader active="posts" />
      <main className="section-shell pageTop">
        <div className="sectionTitle">
          <p className="eyebrow">研究ログ</p>
          <h1>よこぼのあそび倉庫</h1>
          <p>
            公開中のAI実験、画像・動画あそび、ゲーム、3D、Web、気づきログです。
            {selectedLabel ? `いまは「${selectedLabel}」を表示しています。` : ""}
            {query ? `「${query}」で検索しています。` : ""}
          </p>
        </div>

        <form className="logSearchBox" action="/logs" role="search">
          {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
          <input type="search" name="q" defaultValue={query} placeholder="ログを検索" aria-label="ログを検索" />
          <button type="submit">検索</button>
          {query ? <Link href={selectedCategory ? `/logs?category=${selectedCategory}` : "/logs"}>クリア</Link> : null}
        </form>

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
                <span className="chip">{getPostCategories(post).join(" / ")}</span>
                <h2>{post.title || "無題のあそび"}</h2>
                <p>{post.summary || "画像を置いたら、もう投稿。"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="emptyLogState">
            <h2>このテーマのログはまだ準備中です。</h2>
            <p>{query ? "検索条件に合うログがありませんでした。" : "ほかのテーマをのぞくか、ぜんぶのログを見てみてください。"}</p>
            <Link className="aboutButton" href="/logs">ぜんぶみる</Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
