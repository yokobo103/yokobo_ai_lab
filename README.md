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
