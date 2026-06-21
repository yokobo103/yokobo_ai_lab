# GitHub保存ガイド

## 保存方式

Vercel本番では、実行中のファイルシステムへ `data/posts.json` や `public/uploads/` を直接保存しても永続化されません。このため、現在の実装は条件に応じてローカル保存とGitHub保存を切り替えます。

- `data/posts.json` は投稿データ本体です。
- `public/uploads/` は管理画面から保存する投稿画像の置き場です。
- `Vercel` 上で `GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO` が設定されている場合、管理画面の保存処理はGitHub Contents API経由で対象branchへコミットします。
- `GITHUB_BRANCH` が未設定の場合、現在の実装は `main` を使います。
- `GITHUB_AUTHOR_NAME` と `GITHUB_AUTHOR_EMAIL` はコミットのauthor/committer情報に使われます。

主な実装箇所は次のとおりです。

- `lib/github-storage.ts`：環境変数の読取、Contents APIによる取得・コミット
- `lib/posts.ts`：`data/posts.json` の読取・書込と、ローカル/GitHub保存の切替
- `app/api/posts/route.ts`：管理画面からの投稿作成API
- `app/api/upload/route.ts`：`public/uploads/{postId}/` への画像保存とGitHub保存の切替
- `.env.example`：必要な環境変数の例

## 必要な設定

```env
GITHUB_TOKEN=GitHub Fine-grained token
GITHUB_OWNER=yokobo103
GITHUB_REPO=yokobo_ai_lab
GITHUB_BRANCH=main
GITHUB_AUTHOR_NAME=Yokobo
GITHUB_AUTHOR_EMAIL=GitHubのnoreplyメールなど
```

`GITHUB_TOKEN` は対象リポジトリ `yokobo_ai_lab` のみに限定し、Repository permissions の `Contents` を `Read and write` にします。トークンをリポジトリへコミットしません。

## ローカル作業との競合

管理画面経由の保存はGitHubに直接コミットされます。管理画面の保存とローカル編集が近い時間に起きると、特に `data/posts.json` で競合する可能性があります。

1. ローカル作業前に `git status` を確認し、未コミット変更がない状態で必ずpullします。
2. `data/posts.json` を編集した場合、push前にJSON parseと差分を確認します。
3. push前にもremoteの更新を確認します。
4. コンフリクトは自動解決せず、投稿単位で双方の内容を確認します。

JSON parseの簡易確認:

```powershell
node -e "JSON.parse(require('fs').readFileSync('data/posts.json','utf8')); console.log('posts.json OK')"
```

## 保存失敗時の確認

GitHub保存が失敗した場合は、次を確認します。

- トークンが失効していないか、対象リポジトリとContents read/write権限が正しいか
- `GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH` などの環境変数が対象Vercel環境に設定されているか
- owner、repository、branch名が実在する値と一致するか
- 同じファイルが直前に更新され、取得済みSHAとの競合が起きていないか
- APIレスポンスやVercelログに401、403、404、409などのエラーがないか
