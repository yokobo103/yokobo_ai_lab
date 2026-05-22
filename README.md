# よこぼのAIラボ

AI実験、画像生成、ゲーム制作、3D、失敗ログ、気づきメモを気軽に置くための個人サイトです。

メインコピー:

> AIで遊び、気づけば自分が変わっていた。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に管理画面用のパスワードを設定します。

```env
ADMIN_PASSWORD=好きなパスワード
```

## 起動

```bash
npm run dev
```

- LP: `http://localhost:3000/`
- 投稿一覧: `http://localhost:3000/posts`
- 管理画面: `http://localhost:3000/admin`

## フォルダ構成

```text
.
├─ app/                         Next.js App Router のページ、API、共通UI
│  ├─ admin/                    管理画面
│  ├─ api/                      投稿保存、画像アップロード、リアクションAPI
│  ├─ posts/                    投稿一覧、投稿詳細
│  ├─ about/                    Aboutページ
│  └─ logs/                     ログ系ページ
├─ data/
│  └─ posts.json                投稿データ本体
├─ lib/                         投稿、Markdown、GitHub保存などの共通処理
├─ public/
│  ├─ assets/                   LPやUIで使う固定アセット
│  ├─ design-reference/         デザイン参考画像
│  ├─ images/                   既存記事やステータス用の固定画像
│  └─ uploads/                  管理画面からアップロードされた投稿画像
├─ docs/                        運用メモ、アセット棚卸し
├─ prompts/                     画像・素材生成用のプロンプトメモ
├─ AGENTS.md                    開発方針、要件、デザイン方針
└─ README.md                    このファイル
```

## 投稿データ

投稿データは `data/posts.json` に保存します。DBは使っていません。

画像はブラウザからアップロードでき、`public/uploads/{postId}/` に保存されます。`sharp` が利用できる環境では WebP 変換とリサイズを行います。

- 通常画像: 長辺 1600px 以内
- サムネ画像: 長辺 600px 以内
- HEIC/HEIF: MVPでは未対応。JPEG/PNGに変換してからアップロードしてください。

## 管理画面でできること

- `ADMIN_PASSWORD` による簡易パスワードゲート
- 投稿作成、編集
- 下書き保存、公開
- Markdown本文入力
- サムネ画像アップロード
- 複数ギャラリー画像アップロード
- アップロード済み画像のMarkdown挿入
- タイトルなし、本文なしの画像だけ投稿

## Vercel運用時の制限

Vercel 本番では、実行時に `data/posts.json` や `public/uploads/` へ直接保存しても永続化されません。

このリポジトリでは、Vercel 上で `GITHUB_TOKEN` などの環境変数が設定されている場合、管理画面の保存処理は GitHub Contents API 経由で `data/posts.json` と `public/uploads/` にコミットします。

Vercel の Environment Variables に以下を設定してください。

```env
ADMIN_PASSWORD=管理画面のパスワード
GITHUB_TOKEN=GitHub Fine-grained token
GITHUB_OWNER=yokobo103
GITHUB_REPO=yokobo_ai_lab
GITHUB_BRANCH=main
GITHUB_AUTHOR_NAME=Yokobo
GITHUB_AUTHOR_EMAIL=GitHubのnoreplyメールなど
```

`GITHUB_TOKEN` は対象リポジトリを `yokobo_ai_lab` に限定し、Repository permissions の `Contents` を `Read and write` にしてください。

保存後は GitHub にコミットが作られ、Vercel の Git 連携により再デプロイ後に公開サイトへ反映されます。

## 検証

```bash
npm run lint
npm run typecheck
npm run build
```
