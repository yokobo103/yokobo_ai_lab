# Codex Start Here

このリポジトリは「よこぼのAIラボ」の公開Webサイト本体です。Next.jsによる公開実装を管理し、UI、ページ、ルーティング、3つの `data/*.json` 正本、画像参照、管理画面、表示確認を担当します。

最初に [current-site-map.md](./current-site-map.md) を読み、現行ルートと退役済み旧ルートを区別してください。旧 `/experience`、`/logs`、`/posts*` はページ実装が削除され、308恒久リダイレクトだけが残る互換入口です。

上流のHQリポジトリは `C:\Users\Yokob\playground\_LAB_HQ` にあります。HQは企画、inbox、原稿、素材所在、Codexキュー、判断待ちの置き場です。2つは `C:\Users\Yokob\playground\` 直下の独立した兄弟リポジトリで、それぞれ別のGitHubリポジトリへ同期します。

## 作業開始時

Webサイトリポジトリを触る前は、必ず最新化します。可能なら `C:\Users\Yokob\playground\tools\git\` の共通PowerShellスクリプトを使います。共通スクリプトが未実装の場合は、暫定的に次を実行します。

```powershell
cd "C:\Users\Yokob\playground\20260428_webサイト刷新"
git status --short
git pull --rebase
node -e "JSON.parse(require('fs').readFileSync('data/posts.json','utf8')); console.log('posts.json OK')"
node -e "for (const f of ['data/experiences.json','data/site-updates.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('site JSON OK')"
```

`git status --short` に出力がある場合は、`git pull --rebase` を実行しません。既存変更を上書きせず、作業を停止して変更状況を報告します。pullでコンフリクトが発生した場合も自動解決せず、停止して報告します。

pull後は、変更対象にかかわらず `data/posts.json`、`data/experiences.json`、`data/site-updates.json` のJSON parse成功を確認します。これらは管理画面保存とローカル編集の両方で更新される可能性があるため、特に競合注意ファイルとして扱います。

その後、次を確認します。

1. HQ由来の作業では、Webサイトリポジトリだけを見て意図を推測しすぎません。必要に応じてHQの `STATE.md`、`decisions/`、`CODEX_QUEUE.md`、関連する `reports/`、引き渡し文書を確認します。`NOW.md` は退役済みです。
2. HQとの役割分担は [hq_web_contract.md](./hq_web_contract.md) を確認します。
3. GitHub/Vercel保存を扱う場合は [github_storage_guide.md](./github_storage_guide.md) を確認します。
4. `data/posts.json`、`data/experiences.json`、`data/site-updates.json` は公開表示へ影響する正本です。`data/posts.json` の編集前は [posts_json_rule.md](./posts_json_rule.md) を確認し、他2ファイルにも同じ競合回避原則を適用します。

## 作業後

変更後は、可能な範囲で次を実行します。

```powershell
npm run lint
npm run typecheck
npm run build
```

変更ファイル、確認結果、未実行のコマンド、確認できなかったこと、残る判断事項を報告します。HQ由来の意図や公開判断が不明な場合は、推測で埋めずHQへ戻します。
