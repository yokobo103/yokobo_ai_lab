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

このMVPはローカル開発環境でのファイル保存を優先しています。Vercel の通常デプロイでは、実行時に `data/posts.json` や `public/uploads/` へ保存しても永続化されません。

次フェーズでは以下のいずれかへ移行する想定です。

- GitHub APIで `data/posts.json` と画像をリポジトリへコミットする
- Cloudflare R2 / Supabase Storage に画像を保存する
- 投稿JSONだけGitHub、画像だけR2のハイブリッドにする

## 検証

```bash
npm run lint
npm run typecheck
npm run build
```
