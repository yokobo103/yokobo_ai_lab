# よこぼのAIラボ

AI実験、画像生成、ゲーム制作、3D、失敗ログ、気づきメモを気軽に置くための個人サイトです。

公開サイトの実装正本はこのリポジトリです。現行ルート、データ正本、退役済み旧ルートの区別は [docs/current-site-map.md](docs/current-site-map.md) を参照してください。

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
- 実験室: `http://localhost:3000/experiments`
- 資料室: `http://localhost:3000/read`
- ラボ案内: `http://localhost:3000/about`
- 歴史資料館: `http://localhost:3000/history`
- 管理画面: `http://localhost:3000/admin`

## フォルダ構成

```text
.
├─ app/                         Next.js App Router のページ、API、共通UI
│  ├─ admin/                    管理画面
│  ├─ api/                      投稿保存、画像アップロード、リアクションAPI
│  ├─ _redesign/                現行公開UI、ルート定義、表示用データ変換
│  ├─ experiments/              現行の実験室
│  ├─ read/                     現行の資料室、研究記録詳細
│  ├─ about/                    Aboutページ
│  ├─ history/                  歴史資料館
│  └─ layout.tsx                全ページ共通レイアウト
├─ data/
│  ├─ posts.json                資料室・管理画面の研究記録データ正本
│  ├─ experiences.json          実験室・管理画面の実験データ正本
│  └─ site-updates.json         トップ更新情報のデータ正本
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

旧 `/experience`、`/logs`、`/posts*` はページ実装を持たず、`next.config.ts` の308恒久リダイレクトで現行ルートへ転送します。

## 投稿データ

研究記録は `data/posts.json`、実験室は `data/experiences.json`、トップ更新情報は `data/site-updates.json` に保存します。DBは使っていません。

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

Vercel 本番では、実行時に `data/*.json` や `public/uploads/` へ直接保存しても永続化されません。

このリポジトリでは、Vercel 上で `GITHUB_TOKEN` などの環境変数が設定されている場合、管理画面の保存処理は GitHub Contents API 経由で `data/posts.json`、`data/experiences.json`、`data/site-updates.json` と `public/uploads/` にコミットします。

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
