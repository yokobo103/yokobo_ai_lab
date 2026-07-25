# サイト刷新後の古い情報・旧実装監査

調査日: 2026-07-25

## 結論

2026年7月の大規模刷新後も、旧サイトのルート、UI、手順書、設計仕様が同じリポジトリに残り、明確な退役表示がありませんでした。
そのため、ファイルの存在だけを調べたエージェントが「体験格納庫 `/experience` が現行」と誤認できる状態でした。

現行サイトは「実験室 `/experiments`」「資料室 `/read`」が正本です。
「体験格納庫 `/experience`」「発見ログ `/logs`」「投稿 `/posts*`」は退役済みですが、2026-07-25時点では本番で直接アクセスできます。

## 確認した対象

- ローカル公開サイトリポジトリ `20260428_webサイト刷新`
- GitHub `yokobo103/yokobo_ai_lab` の `main`
- 本番 `https://yokobo-ai-lab.vercel.app/`
- 移行元 `20260628_webサイト大改修` / `AI-lab-rebuild-tmp`
- HQ内のサイト関連ガイド、STATE、CODEX_QUEUE、レポート
- Next.js App Routerの全 `page.tsx` / `route.ts`
- 3つの公開JSON正本と読み書き箇所
- Markdown文書内の旧名称・旧URL・退役済み `NOW.md` 参照

調査開始時、両サイトリポジトリはcleanで、`git pull --ff-only` は `Already up to date` でした。
GitHub公開サイト `main` の確認開始時HEADは `d6e67b6` でした。

## 検出結果

### 重大: エージェント入口が旧仕様を現行扱い

1. `AGENTS.md` が `/posts` と `/posts/[id]` を必須ページとして列挙していた。
2. `AGENTS.md` の投稿型が現行 `lib/schema.ts` より古かった。
3. `AGENTS.md` のデザイン指示が、現在の `_redesign` 実装より古い参考画像中心だった。
4. `README.md` が `/posts` を主要起動先として案内していた。
5. `docs/codex_start_here.md` が退役済みHQ `NOW.md` を参照させていた。
6. `docs/taiken-kakunouko-design-spec.md` に退役表示がなく、`/experience` を新規追加する現行命令に見えた。
7. 移行元リポジトリの `AGENTS.md` が「主戦場を移すか未確定」と書いたままだった。

### 重大: 旧UIが本番で生きている

本番で以下を確認しました。

| URL | 表示結果 |
| --- | --- |
| `/experiments` | 現行「実験室」、現行ナビ |
| `/experience` | 旧「体験格納庫」、旧ナビ |
| `/read/20260620-taiken-kakunouko` | 現行記事UI |
| `/posts/20260620-taiken-kakunouko` | 旧記事UI、旧ナビ |
| `/logs` | 旧「よこぼのあそび倉庫」、旧ナビ |

旧ルートは「公開導線から外しただけ」で、削除・リダイレクトされていません。

### 高: canonicalと記事metadataが新旧で不整合

- 旧 `/posts/[id]` はcanonicalを旧 `/posts/[id]` に設定する。
- 本番確認ではcanonicalのホストが `yokobo-ai-89nmab5p4-yokobos-projects.vercel.app` になっていた。
- 現行 `/read/[slug]` は記事別metadata/canonicalを出していない。

現在のユーザー導線は `/read` ですが、検索・共有用metadataは旧記事側の方が強いという逆転状態です。

### 高: 旧ルートを支えるコードが現行コードと同居

旧系統:

- `app/site-chrome.tsx`
- `app/experience/`
- `app/logs/`
- `app/posts/`
- `app/globals.css` 内の旧画面CSS
- `lib/log-categories.ts` の `/logs` リンク

現行系統:

- `app/_redesign/`
- `app/experiments/`
- `app/read/`
- `app/about/`
- `app/history/`

フォルダ名だけでは新旧を判断できない構成でした。

### 中: 古い名称でも現役のデータがある

`data/experiences.json` は体験格納庫時代からの名前ですが、現行実験室と管理画面の正本です。
調査時点で9件すべてが稼働中でした。これは削除対象ではありません。

### 中: 正しく残すべき歴史記録がある

以下は古い情報ではなく、当時の出来事を記録する現役コンテンツです。

- 公開記事「体験格納庫をつくってみた」
- サイト更新履歴
- 歴史資料館の第2世代説明
- 当時の制作レポート・デザイン仕様

一括置換・一括削除は歴史を壊すため不適切です。

### 中: HQの現在地表示にも不整合

- `STATE.md` / `CODEX_QUEUE.md` に体験格納庫タスクが残っていた。
- `STATE.md` のopen件数と、実ファイルから数えたopen件数に差があった。
- HQ作業ツリーには未コミット変更が複数存在した。

既存変更を上書きしないため、今回HQは編集していません。

## 今回行った整備

- `AGENTS.md` の冒頭に現行正本、現行ルート、旧ルート、移行元リポの扱いを追加。
- `AGENTS.md` の必須ページ、デザイン根拠、投稿型の正本参照、JSON競合注意を現状へ更新。
- `README.md` の起動URLと構成説明を現行化。
- `docs/codex_start_here.md` を現行ルート・3 JSON・HQ `STATE.md` 基準へ更新。
- `app/_redesign/data/routes.ts` の移行前コメントを現行正本コメントへ更新。
- 旧ルートのページ、旧UIシェル、未使用移行データへLEGACY/MIGRATIONコメントを追加。
- 体験格納庫仕様書へ退役警告を追加。
- 旧LPアセット棚卸し、ラボ案内仕様、管理画面再設計仕様へ過去資料である注記を追加。
- GitHub保存ガイド、運用メモ、HQ連携契約を3つの現行JSON正本に合わせて更新。
- 恒久的な入口として `docs/current-site-map.md` を追加。
- 移行元リポジトリへ「公開作業先ではない」警告を追加。

## 監査コミット時点では変更しなかったもの

1. 旧 `/experience`、`/logs`、`/posts*` の削除。
2. 旧URLから現行URLへの恒久リダイレクト。後続コミットで308対応済み。
3. 旧 `site-chrome.tsx` と旧CSSの削除。
4. 公開済み記事本文内の旧 `/posts/*` URL置換。
5. canonicalホストと現行 `/read/[slug]` metadataの修正。後続コミットで対応済み。
6. `data/experiences.json` の改名。
7. 未コミット変更があるHQの `STATE.md` / `CODEX_QUEUE.md` 整理。

URL、SEO、過去リンク、管理画面保存へ影響するため、これらは別タスクで段階的に行うべきです。

## 推奨する次工程

1. 308の背後に残る旧UI・旧CSSを、参照調査後に削除する。
2. HQの未コミット作業が整理された時点で、体験格納庫タスクとSTATEを現状へ合わせる。

## 検証結果

- 3つの `data/*.json` parse: 成功
- `npm run lint`: 成功（エラー0、既存の `<img>` 警告34件）
- `npm run typecheck`: 成功
- `npm run build`: 成功
- Next.jsの生成ルート一覧で、現行ルートと旧 `/experience`、`/logs`、`/posts*` の同居を再確認

後続対応では、4系統の旧URLがクエリ文字列を保ったまま308になることと、現行記事が個別titleおよび `https://yokobo-ai-lab.vercel.app/read/[slug]` のcanonicalを出力することをHTTP応答で確認した。
さらに、公開記事データ内に残っていた旧記事URL 10件と旧 `/experience` URL 2件を現行URLへ移行した。歴史を説明する本文、画像保存パス、退役コード内の参照は変更していない。
- `git diff --check`: 成功
