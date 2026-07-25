# 現行サイト正本マップ

最終確認日: 2026-07-25

この文書は、公開サイトの現行実装と、リポジトリ内に残る旧実装を区別するための入口です。
ルート・データ・作業先で迷った場合、古い設計資料やファイル名から推測せず、この文書と現在の実装を確認してください。

## 正本と確認優先順位

1. 公開サイト本体: `20260428_webサイト刷新`
2. GitHub: `yokobo103/yokobo_ai_lab` の `main`
3. 現行ルート定義: `app/_redesign/data/routes.ts`
4. 現行公開UI: `app/_redesign/components/` と `app/_redesign/styles/`
5. 公開データ: `data/posts.json`、`data/experiences.json`、`data/site-updates.json`
6. HQ: 企画・判断・素材・引き渡しの正本。サイトの実装状態はこのリポジトリを優先する

`20260628_webサイト大改修` / `AI-lab-rebuild-tmp` は移行元の作業リポジトリです。公開サイトの変更先ではありません。

## 現行の公開ルート

| ルート | 現行名称 | 主な実装 |
| --- | --- | --- |
| `/` | トップ | `app/page.tsx`、`app/_redesign/components/HeroSection.tsx` |
| `/experiments` | 実験室 | `app/experiments/page.tsx`、`LabExperimentPage.tsx` |
| `/experiments/explore` | 実験室エイリアス | `app/experiments/explore/page.tsx` |
| `/read` | 資料室 | `app/read/page.tsx`、`ReadArchivePage.tsx` |
| `/read/[slug]` | 研究記録詳細 | `app/read/[slug]/page.tsx`、`ArchiveArticlePage.tsx` |
| `/about` | ラボ案内 | `app/about/page.tsx`、`AboutLabPage.tsx` |
| `/history` | 歴史資料館 | `app/history/page.tsx`、`HistoryMuseumPage.tsx` |
| `/admin/*` | 管理画面 | `app/admin/` |

新しい公開導線、内部リンク、記事リンクはこのルート群を使います。

## 退役済みだがコードが残るルート

| 旧ルート | 旧名称・役割 | 現在の扱い |
| --- | --- | --- |
| `/experience` | 体験格納庫 | 308で `/experiments`「実験室」へ転送 |
| `/logs` | 発見ログ一覧 | 308で `/read`「資料室」へ転送 |
| `/posts` | 投稿一覧 | 308で `/read` へ転送 |
| `/posts/[id]` | 旧記事詳細 | 308で `/read/[id]` へ転送 |

これらは `next.config.ts` の恒久リダイレクトで旧クエリ文字列も引き継ぎます。
旧実装コードは段階的な整理に備えて残っていますが、公開リクエストでは旧UIを表示しません。
リダイレクト設定を外したり旧実装を削除したりする場合は、過去リンクへの影響を確認してください。

旧UI系統:

- `app/site-chrome.tsx`
- `app/experience/`
- `app/logs/`
- `app/posts/`
- `lib/log-categories.ts` 内の旧 `/logs` 導線
- `docs/taiken-kakunouko-design-spec.md`（歴史資料）

## データ正本

| ファイル | 現行用途 | 注意 |
| --- | --- | --- |
| `data/posts.json` | 資料室、記事詳細、管理画面 | 管理画面とローカル編集が競合し得る |
| `data/experiences.json` | 実験室、関連ログ、管理画面 | 名前は `experiences` のままだが現役 |
| `data/site-updates.json` | トップページ更新情報、管理画面 | 過去名称を含む更新履歴は歴史記録 |

2026-07-25確認時点では、公開記事26件、実験9件、更新情報16件です。

`data/experiences.json` を「体験格納庫の残骸」と判断して削除・改名しないでください。
現行 `app/_redesign/data/labExperiments.ts` と管理画面APIが使用しています。

## 「体験格納庫」という語の扱い

削除・変更してはいけない歴史記録:

- 歴史資料館の第2世代サイト説明
- 公開記事「体験格納庫をつくってみた」
- サイト更新履歴
- 当時の設計仕様・制作レポート

現行仕様として使ってはいけないもの:

- `/experience` を新しい遊び場の入口として扱うこと
- `app/site-chrome.tsx` の旧ナビを現行ナビとして流用すること
- `docs/taiken-kakunouko-design-spec.md` を新機能の要件として使うこと
- `体験格納庫へ` など未使用移行コード内の文言を、現行画面の文言と誤認すること

## 作業開始時チェック

```powershell
git status --short
git pull --ff-only
node -e "for (const f of ['data/posts.json','data/experiences.json','data/site-updates.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('site JSON OK')"
```

追加で確認すること:

1. 現行ルートか、退役済み旧ルートか。
2. 公開データを触るか。
3. HQの依頼が現在のサイト構造と整合するか。
4. 古い設計資料を参照する場合、歴史資料であることを明示しているか。
5. URL削除・リダイレクト・canonical変更を伴う場合、過去リンクとSEO影響を確認したか。

## 既知の未整理事項

- 公開データ本文に旧 `/posts/*` URLが一部残る。
- 308の背後に旧ページ実装・旧ヘッダー・旧CSSが残る。
- 旧実装を物理削除する前に、外部リンクと管理機能から参照されていないか最終確認が必要。

これらは「現行仕様」ではなく、移行後に残った整理対象です。
