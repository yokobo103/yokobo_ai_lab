# AGENTS.md

## HQ and repository relationship

- 上流のHQリポジトリは `C:\Users\Yokob\playground\_LAB_HQ` にあり、企画・原稿・素材所在・判断待ちを管理する。
- このリポジトリは公開Webサイト本体であり、HQの配下ではない独立した兄弟リポジトリである。
- HQ由来の作業では、最初に `docs/codex_start_here.md` と `docs/hq_web_contract.md` を確認する。
- `data/posts.json` は危険ファイルである。編集時は `docs/posts_json_rule.md` を確認する。
- GitHub/Vercel保存に関わる作業では `docs/github_storage_guide.md` を確認する。

## Mandatory pre-work pull

- このリポジトリを触る前に、必ず `git status --short` で未コミット変更がないことを確認し、最新状態をpullする。
- 未コミット変更がある場合はpullも作業も行わず、停止して変更状況を報告する。
- 可能なら `C:\Users\Yokob\playground\tools\git\` の共通PowerShellスクリプトを使う。未実装の場合は `docs/codex_start_here.md` の暫定コマンドを実行する。
- pull後に `data/posts.json` をJSON parseする。管理画面保存とローカル編集の両方で更新され得るため、特に競合へ注意する。
- コンフリクトは自動解決せず、停止して報告する。

## Project concept

This project is “よこぼのAIラボ”, a playful personal AI lab website.

The core message is:

「AIで遊び、気づけば自分が変わっていた。」

This is not a formal technical blog or heavy CMS.
It is a creative archive for casually posting AI experiments, unfinished ideas, images, failures, tools, game prototypes, 3D trials, and small discoveries.

The most important UX goal:
The owner should be able to post from a browser, ideally from iPhone Chrome, without opening VSCode.

## Product principles

- Make unfinished posts feel acceptable.
- Make image-first posts easy.
- Make posting possible in under 3 minutes.
- Prioritize mobile admin usability over perfect layout.
- Do not require manual image placement in VSCode.
- Keep the system simple and maintainable.
- Avoid over-engineering.
- Prefer local JSON/GitHub-backed storage first, not a database.
- Use Japanese UI copy.

## Design direction

Use the provided reference images in `/public/design-reference/`.

Visual direction:
- Cute but not childish.
- Friendly AI lab.
- Blue, white, navy, warm beige.
- Rounded cards.
- Cat scientist and small robot mascot mood.
- Playful “research archive” feeling.

## Tech direction

Use:
- Next.js App Router
- TypeScript
- React
- CSS Modules or simple global CSS
- Markdown rendering for post bodies

Avoid:
- Large CMS frameworks
- Database setup in the first MVP
- Complex authentication
- Overly abstract component structures

## Required pages

- `/` landing page
- `/posts` public post list
- `/posts/[id]` public post detail
- `/admin` simple admin dashboard

## Admin requirements

The admin page must support:
- Password gate using `ADMIN_PASSWORD`
- Create post
- Edit post
- Save draft
- Publish
- Preview
- Upload thumbnail
- Upload multiple gallery images
- Insert uploaded image into Markdown
- Image-first post creation
- Empty body is allowed if title or image exists
- iPhone Chrome usable layout

## Image requirements

- Upload images from browser.
- Support file input, not only drag and drop.
- Support iPhone photo library selection.
- Multiple image selection.
- Convert uploaded images to WebP if feasible.
- Resize large images to max width 1600px.
- Generate thumbnail max width 600px.
- Save optimized public images to `/public/uploads/{postId}/`.
- Do not commit original full-size images by default.
- If HEIC/HEIF is hard to handle, show a clear Japanese error message.

## Post schema

```ts
type Post = {
  id: string;
  title: string;
  summary: string;
  category:
    | "画像生成"
    | "ゲーム制作"
    | "3D"
    | "AIツール"
    | "失敗ログ"
    | "気づき"
    | "メモ";
  status: "draft" | "public";
  tags: string[];
  thumbnail: string;
  images: string[];
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
  updatedAt: string;
};
Validation

After implementation:

Run lint if available.
Run typecheck if available.
Run build.
Report what was changed and any remaining limitations.
