# 運用メモ

## 投稿の流れ

1. `/admin` を開く
2. `ADMIN_PASSWORD` を入力する
3. 「新しいあそび」を押す
4. タイトル、ひとこと、カテゴリを入れる
5. 画像を選ぶ
6. 必要なら「Markdownに挿入」を押す
7. `Save Draft` または `Publish` を押す

画像だけの投稿もできます。本文は空で問題ありません。

## iPhone Chrome

ファイル入力ボタンから写真ライブラリを選択できます。ドラッグ&ドロップ前提ではありません。

HEIC/HEIFはMVPでは未対応です。アップロード時にエラーが出た場合は、JPEG/PNGへ変換してから再度アップロードしてください。

## データのバックアップ

ローカル運用では以下を定期的にGit管理してください。

- `data/posts.json`
- `public/uploads/`

ただし、元の大きな画像は保存せず、アップロード時に最適化された画像だけを使う前提です。

## 本番移行

Vercelで運用する場合、ファイルシステム保存は永続化されません。このリポジトリでは、Vercel上でGitHub用の環境変数が設定されている場合、GitHub API保存方式で動きます。

- 管理画面から投稿を保存
- API RouteがGitHub Contents APIへJSONをコミット
- 画像も最適化後に `public/uploads/` へコミット
- GitHubへのコミットをきっかけにVercelが再デプロイ
- 再デプロイ後に公開ページへ反映

Vercelの Environment Variables には以下を設定してください。

```env
ADMIN_PASSWORD=管理画面のパスワード
GITHUB_TOKEN=GitHub Fine-grained token
GITHUB_OWNER=yokobo103
GITHUB_REPO=yokobo_ai_lab
GITHUB_BRANCH=main
GITHUB_AUTHOR_NAME=Yokobo
GITHUB_AUTHOR_EMAIL=GitHubのnoreplyメールなど
```

`GITHUB_TOKEN` は `yokobo_ai_lab` のみを対象にし、Repository permissions の `Contents` を `Read and write` にします。
