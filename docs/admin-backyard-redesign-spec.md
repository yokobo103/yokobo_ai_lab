# 管理画面「ラボのバックヤード」再設計 仕様書

> [!NOTE]
> これは2026年7月時点の実装計画・受け入れ記録です。現行ルートや現在のAPI機能を判断する正本ではありません。
> 現在地は [`current-site-map.md`](./current-site-map.md) と実装コードを確認してください。

- 作成日：2026-07-07
- 対象サイト：`20260428_webサイト刷新`（Next.js 16 App Router / React 19）
- 対象：`/admin`（管理画面）全面再設計 + 関連API + 一部フロント整合
- 実装担当：Codex
- ステータス：**実装済みの過去計画**（現在の機能は実装コードで確認）
- 作成：Claude（2026-07-07 の管理画面調査に基づく）

> **最重要**：この再設計のゴールは「**フロント（新デザイン）を、フロントの形のまま心地よく編集できること**」。管理画面はフロントの世界（暗い館内の展示室）に対する**バックヤード（研究室の作業机）**として作る。見た目の刷新は最後のフェーズであり、先に「編集対象と表示結果のズレ」を解消する。

---

## 0. これは何か（一言）

**旧デザイン時代のまま取り残された管理画面を、4フェーズで「新フロントの編集卓」に作り変える。**
フェーズは独立して完結し、各フェーズ後にリリース可能な状態を保つ。順番を入れ替えない。

| フェーズ | 内容 | 価値 |
|---|---|---|
| 1 | 実プレビュー（フロントと同一レンダリング） | 公開前に本当の見た目が分かる |
| 2 | 実験（experiences）フルCRUD + ログ紐付け編集 | JSON手編集の廃止・紐付けのコントロール |
| 3 | スキーマ/語彙の棚卸し | 「保存した結果がどこに出るか」の一致 |
| 4 | ルート分割 + バックヤード世界観へリスタイル | 迷子にならない・世界観がつながる |

---

## 1. 背景：現状の問題（2026-07-07 調査）

1. **編集範囲のズレ**：フロント実験室カードの正本 `data/experiences.json` は、管理画面から `labThumbnail` しか編集できない（`/api/experiences` PATCH が他フィールドを受け付けない）。タイトル・summary・タグ・playUrl・live/wip・featured・**関連ログ紐付け（relatedPostId/relatedPostIds）** はJSON手編集のみ。
2. **紐付けがコントロール不能**：`relatedPostIds` は (a) 実験カードのサムネ自動選択、(b) 資料室記事→「実験で遊ぶ」導線、(c) 実験→関連ログ導線（`app/_redesign/data/experimentRelations.ts`）の3か所を左右する重要データなのに、編集UIがない。単数 `relatedPostId` と複数 `relatedPostIds` の二重構造も残る。
3. **プレビューが偽物**：管理画面のプレビュータブは `<pre>` に生Markdownを出すだけ。フロントは `app/_redesign/utils/markdown.ts` の `markdownToHtml` + `.archive-markdown` スタイル（`read-page.css`）で描画。
4. **`:::note` 記法が未実装（実バグ）**：管理画面ツールバーに Note ボタンがあり **24記事中10記事** が `:::note` を含むが、`markdownToHtml` は非対応で公開ページに生テキストのまま出る。
5. **カテゴリの断絶**：管理画面のカテゴリ（画像・動画あそび 等6種）は、資料室 `/read` のフィルタ（開発ログ/考えたこと/失敗の記録/お知らせ）と別物。`ReadArchivePage.tsx` の `articleToResearchLog` が全記事を `"開発ログ"` 固定にマップしており、フィルタが実質機能していない。
6. **死にフィールド**：`weeklyPickup` / `archivePickup` は新デザインで未使用（管理画面自身が注記）。resultStatus 6種はフロントで3種（成功/失敗/調整中）に潰される。
7. **構造の過密**：`app/admin/ui.tsx` 1255行 + `admin.css` 1318行の単一クライアントコンポーネント。5ビューが**全同時マウント**でCSS出し分け（ページ実測高 約5400px）。URLが常に `/admin` でリロード・直リンク・ブラウザバック不可。モバイル/デスクトップのメタ入力欄が二重実装。
8. **世界観の断絶**：管理画面は旧デザイン（白×水色×角丸28px×`#2f7df6`）。フロントは「暗い館内+紙+teal」。

---

## 2. 全体ルール（全フェーズ共通）

### 2.1 原則
- **フロントが正**：表示に使われないものは編集させない。編集させるものは表示への効き方を画面上で示す。
- **書き込み一箇所主義**：紐付けデータの正本は `experiences.json` 側のみ。記事側UIから付け外しできても、書き込み先は常に実験側。データを両側に複製しない。
- **既存の保存経路を変えない**：読み書きは既存の `lib/posts.ts` / `lib/admin-experiences.ts`（ローカルFS / GitHub Contents API の自動切替）を経由する。認証も現行方式（`x-admin-password` ヘッダ + sessionStorage）を**維持**し、このプロジェクトでは改造しない。
- **公開URLを壊さない**：投稿 `id` は公開URL（`/read/<id>`）そのもの。ID変更・削除の扱いは現行仕様を踏襲。

### 2.2 データ安全
- `data/posts.json` は [posts_json_rule.md](./posts_json_rule.md) 遵守。**`data/experiences.json` も同格の危険ファイルとして同じルールで扱う**（作業前pull・parse確認・大量整形禁止・コンフリクトマーカー確認）。
- スキーマ変更は**読み取り側は寛容、書き込み側は正規化**（古いフィールドを読めるまま、保存時に新形式へ寄せる）。一括マイグレーションコミットは作らない。

### 2.3 検証（各フェーズ共通の完了条件）
1. `npm run lint` / `npm run typecheck` / `npm run build` が通る
2. デスクトップ（1280px）とモバイル（375px）で対象画面を目視確認、コンソールエラーなし
3. 保存→フロント該当ページ（`/read`、`/read/<id>`、`/experiments`）への反映を実データで1件確認
4. 変更ファイル・確認結果・残課題を報告

---

## 3. フェーズ1：実プレビュー

### 3.1 `:::note` をフロントに実装（先行バグ修正）
- `app/_redesign/utils/markdown.ts` の `markdownToHtml` に `:::note 〜 :::` ブロック対応を追加。出力例：`<aside class="archive-note">…（中身は通常のMarkdown処理）…</aside>`
- `read-page.css` に `.archive-note` のスタイルを追加（資料室の世界観に合わせた控えめな補足枠。囲み罫 + 小さめ文字程度。派手にしない）
- 既存10記事の表示が壊れないことを `/read/<id>` で2〜3件確認

### 3.2 プレビューの本物化
- 管理画面のプレビューを `<pre>` から **フロントと同一の `markdownToHtml` + `.archive-markdown` スタイル**による描画へ置き換える
- スタイルは複製しない。`read-page.css` から記事本文系（`.archive-markdown` 一式 + `.archive-note`）を共通CSS（例 `app/_redesign/styles/article-body.css`）へ**切り出して両方から読む**
- プレビューに出す要素と順序は記事ページ（`ArchiveArticlePage.tsx`）に合わせる：タイトル / 担当 / resultStatusバッジ（6種の画像バッジ） / サムネ / 本文HTML / タグ / 関連リンク
- レイアウト：**デスクトップ（≥1080px）は編集｜プレビューの左右2ペイン**（本文textareaとプレビューが並ぶ）。モバイルは現行どおりタブ切替
- `dangerouslySetInnerHTML` を使う（フロントと同じ経路・同じサニタイズ関数なのでリスク同等）

### 3.3 このフェーズでやらないこと
- エディタのフォーム構成変更（フェーズ4）
- draftMode 等による公開ルート側の下書きプレビュー（非ゴール参照）

---

## 4. フェーズ2：実験フルCRUD + 紐付け編集

### 4.1 API拡張（`app/api/experiences/route.ts` + `lib/admin-experiences.ts`）
- PATCH を拡張し、以下を編集可能にする（すべて任意・部分更新）：
  `title` / `summary` / `category`（`game|tool|3d-ar|web|av|prototype`） / `tags`（string[]） / `playUrl` / `status`（`live|wip`） / `featured`（boolean） / `labThumbnail` / `relatedPostIds`（string[]）
- バリデーション：`playUrl`・`labThumbnail` は既存 `normalizeLabThumbnail` と同等の形式チェック。`relatedPostIds` は**実在する投稿IDのみ通す**（`readPosts()` と突合）。`title` 空は 400
- **`relatedPostId`（単数・レガシー）は保存時に `relatedPostIds` へ統合し、そのレコードからフィールドを削除**。読み取り側（`labExperiments.ts` / `experimentRelations.ts` / 管理画面）は両対応のまま維持
- POST（新規作成：`archiveNo` は既存最大+1で採番、`addedAt` に当日）と DELETE（`archiveNo` 指定）を追加。`localSource` / `visualVariant` / `visualDensity` はAPIで受けない（既存値を保持）
- 書き込みは既存 `writeAdminExperiences` を使用（GitHub storage 対応を無償で得る）

### 4.2 実験編集UI（管理画面「実験室」タブの置き換え）
- 一覧は**フロントの実験室カードに近い見た目**のカードで表示（サムネ・タイトル・カテゴリ・LIVE/WIP・featured・関連ログ数）
- カードを開くと編集フォーム：上記フィールド + 保存/削除。削除は `window.confirm` で「公開ページの実験室からカードが消える」ことを明示
- **関連ログピッカー（このフェーズの中核）**：
  - 投稿をタイトル・タグでインクリメンタル検索して複数選択
  - 選択済みは並び替え可能。**先頭の記事のサムネがカード画像の自動選択に使われる**ことをUI上に明記し、現在の解決結果（指定サムネ / 先頭関連記事サムネ / fallback）をプレビュー表示
  - **重複紐付け警告**：選択した投稿が他の実験の `relatedPostIds` に既に含まれる場合、「資料室の逆引きは先勝ちのため〈○○〉側が優先されます」と警告（保存は妨げない）
- 既存の「実験室サムネ」節（`renderExperimentSettings`）はこの新UIに吸収して廃止

### 4.3 記事エディタ側の逆方向表示
- 記事エディタに「実験との紐付け」節を追加：この記事を参照している実験を表示（`experiences` から逆引き）
- その場で付け外し可能にする。ただし**保存先は `/api/experiences` の `relatedPostIds`**（記事の保存とは独立に即時PATCH）。記事データには何も書かない

---

## 5. フェーズ3：スキーマ/語彙の棚卸し

> ここは公開側の表示に触る。1項目=1コミットで小さく進める。

### 5.1 資料室カテゴリを管理画面から制御できるようにする【要判断・推奨案】
- `Post` に任意フィールド `logCategory`（`"開発ログ" | "考えたこと" | "失敗の記録" | "お知らせ"`）を追加。既定値 `"開発ログ"`
- 管理画面エディタに選択UIを追加（「資料室の分類」ラベル。既存の あそびカテゴリ とは別物であることを明記）
- `ReadArchivePage.tsx` の `articleToResearchLog` が `"開発ログ"` 固定でなく `logCategory` を使うよう変更 → **資料室フィルタが初めて機能する**
- 既存記事は未設定=開発ログのままで表示不変（安全なデフォルト）
- ※代替案（資料室フィルタ自体を あそびカテゴリ6種に変える）は公開UIの再デザインになるため不採用。よこぼが代替案を望む場合はこの項を差し替え

### 5.2 死にフィールドの整理
- `weeklyPickup` / `archivePickup`：管理画面UIから削除。`lib/schema.ts` の型からも削除し、`normalizePost` は入力にあっても**保存時に落とす**（保存した投稿からのみ消える。posts.json の一括整形はしない）
- `pinned`：**管理画面内部の整理用として存続**（フロント非表示）。エディタ上に「管理用。公開ページには出ません」と注記
- `resultStatus`：6種を**維持**。管理画面の一覧・エディタに「資料室リストでは UNSTABLE→調整中 のように3種に丸められる」対応表を表示するだけに留める（`success→成功` / `failed→失敗` / その他→調整中）

### 5.3 X投稿まわり（現状維持）
- ツイート文生成・コピー・intent は現行機能を維持。フェーズ4で配置だけ整理

---

## 6. フェーズ4：ルート分割 + バックヤード世界観

### 6.1 ルート構成（`app/admin/`）
```
app/admin/
  layout.tsx        … 認証ゲート + シェル（サイドバー/bottomNav）+ AdminProvider
  page.tsx          … ホーム（今日の入口：新規/下書き/最近編集）
  logs/page.tsx     … ログ一覧（検索・フィルタ。クエリパラメータに反映）
  logs/new/page.tsx … 新規作成（作成後 /admin/logs/<id> へ）
  logs/[id]/page.tsx… エディタ（フェーズ1の2ペイン）
  experiments/page.tsx … 実験一覧+編集（フェーズ2のUI）
  settings/page.tsx … 設定
```
- **ビュー=URL**。リロード・直リンク・ブラウザバックが全画面で機能すること
- 全ビュー同時マウントを解消（現行の `view-*` CSS出し分けを廃止）
- 状態管理：`AdminProvider`（client context）に 認証パスワード・posts・experiences のロードとCRUD関数を集約（現行 `ui.tsx` のfetch群を `useAdminPosts` / `useAdminExperiences` フックへ整理）。1ファイル1ビュー、共有ロジックは hooks へ
- 編集中の離脱ガード：未保存変更があるときのページ遷移に `confirm`（beforeunload + リンク遷移時）

### 6.2 リスタイル：「研究室のバックヤード」
- テーマ：公開側が「展示室」なら管理側は**「作業机のある研究室の裏側」**。同じ世界の裏方であることが伝わる見た目にする
- トークンは `app/_redesign/styles/tokens.css` を import して流用：
  - 背景：`--color-navy`（#0b1d33）系のダーク。装飾写真は敷かない（作業場なので無地でよい）
  - アクセント：`--color-cyan` / teal 系。ラベル・番号・アクティブ状態に
  - 見出し・ID・日付：IBM Plex Mono（フロントで読込済みのフォント）
  - **編集フォームの入力面は明るいパネル**（紙色 `#fff7eb` 系）にしてよい。長文編集の可読性を世界観より優先する
- 旧 `admin.css` は全面書き換え（現行の `#2f7df6` 青・角丸28px・白背景の系統は廃止）
- モバイル：bottomNav は維持。`mobileMetaPanel` / `desktopMetaFields` の二重実装を単一のレスポンシブ実装に統合
- 375px幅で横スクロールが出ないこと

### 6.3 ホームの役割
- 現行の「完成してなくてOK。今日のあそびを、まず置いておく。」のトーンは**残す**（このコピーは良い）。新規作成・下書き続行・最近編集の3導線をそのまま新スタイルで

---

## 7. 完了条件（全フェーズ後の受け入れチェック）

1. 管理画面のプレビューと `/read/<id>` の本文表示が一致する（`:::note` 含む）
2. 実験のタイトル・summary・タグ・playUrl・live/wip・featured・サムネ・**関連ログ**がすべて管理画面から編集でき、`/experiments` と `/read` の導線に反映される
3. `data/experiences.json` / `data/posts.json` の手編集を必要とする運用が残っていない（`localSource` 等の表示専用フィールドを除く）
4. 資料室のカテゴリフィルタが管理画面の設定で動く
5. `/admin/logs/<id>` を直接開いて編集を再開できる
6. lint / typecheck / build 通過。既存24記事・9実験の表示劣化なし

## 8. 非ゴール（やらないこと）

- 認証方式の変更（OAuth・セッション管理など）。現行パスワード方式のまま
- トップ・about・実験室ページのハードコード文言/画像のCMS化
- Next.js draftMode 等による公開ルート側の下書きプレビュー
- 旧ルート（`/experience` `/posts` `/logs` `/about-proto`）の削除・整理（別件として扱う）
- エディタのWYSIWYG化・リッチテキスト化（Markdown textarea を維持）
- `visualVariant` / `visualDensity` の編集UI（現状JSON管理のまま）

## 9. 参考（調査時の実測・根拠）

- 管理画面本体：`app/admin/ui.tsx`（1255行）/ `app/admin/admin.css`（1318行）
- 実験API制限：`app/api/experiences/route.ts`（PATCH が labThumbnail のみ）
- 紐付けの使用箇所：`app/_redesign/data/experimentRelations.ts` / `labExperiments.ts`（サムネ自動解決）/ `ReadArchivePage.tsx`（遊ぶ導線）
- カテゴリ固定マップ：`ReadArchivePage.tsx` `articleToResearchLog`（`category: "開発ログ"` 固定）
- `:::note` 使用記事：24記事中10記事（2026-07-07 時点の `data/posts.json`）
- 全ビュー同時マウント：`view-home` 状態で logColumn / editorColumn とも高さ5373px を実測
