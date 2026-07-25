# 体験格納庫（LAB ARCHIVE）デザイン仕様書

> [!WARNING]
> **退役済みの歴史資料です。現行サイトの実装仕様ではありません。**
> 「体験格納庫」`/experience` は2026年7月のサイト刷新で「実験室」`/experiments` に置き換えられました。
> 新規実装・新規導線の根拠には使わず、[`current-site-map.md`](./current-site-map.md) を参照してください。
> `data/experiences.json` は現行実験室でも使うデータ正本なので、旧仕様書と一緒に削除しないでください。

- 作成日：2026-06-20（v2：ルート/名称/初版対象/研究メモを確定）
- 対象サイト：`20260428_webサイト刷新`（Next.js 16 App Router / React 19 / CSS変数テーマ）
- 実装担当：Codex
- 参考モックアップ：`_LAB_HQ/inbox/pic/ChatGPT Image 2026年6月20日 20_23_53.png`
- 関連台帳：`_LAB_HQ/outputs/published_index.json`（公開物の正本。格納庫の供給ライン）
- ステータス：**退役済み**（歴史資料として保存）

### 確定事項（よこぼ判断・2026-06-20）
1. ルートは **`/experience`**（experience で始める）
2. 名称は全面的に **「体験格納庫」**（保管庫ではなく格納庫。語感優先）
3. 初版は **サイトで公開済みのものだけ**（`published_index.json` の `siteStatus="linked"` の **7件**）。未掲載4件は今回載せない
4. 「研究メモ（Dr.よこぼ）」の文面は**本書の初稿（6章）を採用**し、よこぼが後で微調整

---

## 0. これは何か（一言）

**よこぼのAIラボで生まれ、すでに世に公開された「遊べる・触れる成果物」を、ひとつの棚に集めて並べる新ページ。**
発見ログ（=読み物）に対して、体験格納庫は**「いますぐ触れる体験」**の入り口。`/experience` として新規追加する。

> コンセプト：*魔法使いの研究室の奥にある「体験の格納庫」。来館者が古びた標本箱（=体験カード）をめくり、ボタンを押すとその体験がそのまま立ち上がる。*

---

## 1. ゴールと非ゴール

### ゴール
- **公開済み**の遊べる成果物（github.io / vercel のデモ）を**カードで一覧**し、1クリックで**体験（外部URLを別タブ）**できる
- カテゴリ絞り込み・並び替え・ランダム体験・お気に入り保存ができる
- 各体験から**関連する発見ログ**（`/posts/[id]`）へ往復できる
- 「魔法の研究室の格納庫」の世界観で、見た瞬間に**ワクワクする**

### 非ゴール（今回やらない）
- 未掲載（サイト未公開）の成果物の掲載 → 今回は対象外
- 体験を格納庫内に埋め込み再生（iframe実行） → 今回は外部リンク遷移のみ
- 管理画面（`/admin`）からの体験CRUD → データは後述JSONを更新
- ログイン・サーバ保存のお気に入り → **localStorageのみ**

---

## 2. 情報設計とルーティング

| 項目 | 内容 |
|---|---|
| ルート | `app/experience/page.tsx`（パス `/experience`） |
| レンダリング | 静的（`force-dynamic`不要）。データはビルド時読み込みのJSON |
| ナビ追加 | `app/site-chrome.tsx` の `navLinks` に `{ href: "/experience", label: "体験格納庫", key: "experience" }` を「発見ログ」の次に挿入。各ページの `active` キーも対応 |
| 検索ボックス | ヘッダー既存の検索は `/logs` のまま（変更しない） |

---

## 3. データ契約（最重要）

Vercel上ではHQフォルダを実行時に読めないため、**サイトリポ内に専用JSONを持つ**。

- 置き場所：`data/experiences.json`
- 正本との関係：HQの `_LAB_HQ/outputs/published_index.json` を元に作る。**初版は `siteStatus="linked"` の7件のみ**。将来 `scan_published.py` に「サイト用 experiences.json 書き出し」を足して同期する（今回はCodexが初版を手動生成でよい）
- 読み込み：`lib/experiences.ts` を新設し、`readExperiences()` でJSONを読む（`lib/posts.ts` と同じ作法）

### 1件の型（`lib/experiences.ts` に `Experience` 型として定義）

```ts
export type ExperienceCategory =
  | "game" | "tool" | "3d-ar" | "web" | "av" | "prototype";

export type Experience = {
  archiveNo: number;        // 表示用通し番号（例 1 → "No.0001"）
  title: string;            // 例「3Dカートゲーム（マリオカート風）」
  category: ExperienceCategory;
  summary: string;          // 1〜2行。カードの短い説明
  thumbnail: string;        // /assets/experience/thumbs/xxx.webp（無ければプレースホルダ）
  tags: string[];           // 最大4表示
  playUrl: string;          // 外部デモURL（別タブ）
  relatedPostId?: string;   // 関連発見ログ posts.json の id（あれば「関連ログ」表示）
  localSource?: string;     // 由来フォルダ名（表示しない・管理用メモ）
  status: "live" | "wip";   // live=体験可 / wip=準備中（淡色・体験ボタン無効）
  featured?: boolean;       // ピックアップ（ヒーロー周辺で強調）
  addedAt: string;          // ISO日付。並び替え「新しい順」用
};
```

### カテゴリのラベル/アイコン定義（`lib/experiences.ts`）

| slug | ラベル | 由来（log-categories対応） |
|---|---|---|
| `game` | ゲーム | ゲームあそび |
| `tool` | ツール | AIしくみあそび |
| `3d-ar` | 3D・AR | 3D・空間あそび |
| `web` | Web | Webあそび |
| `av` | 動画・音声 | 画像・動画あそび |
| `prototype` | プロトタイプ | （横断・実験） |

※フィルタは「すべて」を先頭に、上記6つを並べる（モックアップ準拠）。初版データに該当が無いカテゴリのピルも**表示はする**（押すと「この箱はまだ空っぽ」空状態を見せる）。

### 初版データ（7件・`published_index.json` の linked から変換）

| archiveNo | title | category(推奨) | playUrl | relatedPostId | localSource |
|---|---|---|---|---|---|
| 1 | よこぼ 猫の森ラン | game | https://yokobo103.github.io/yokobo-cat-forest-run/ | 323c30ae-d25a-4ef8-b647-117e2b17f933 | 20260425_猫スクロールゲームをつくってみる |
| 2 | 3Dカートゲーム（マリオカート風） | game | https://yokobo103.github.io/3D_cart_game/ | dc2b464b-63ee-41a0-986b-fb84b8f06f48 | 20260502_マリオカート風ゲームを作ってみる |
| 3 | リアルタイム翻訳アプリ（GPT） | tool | https://gpt-rt-translate-app.vercel.app/ | 2b237510-0f6c-4d24-bf2c-77ab0b07869d | 20260508_gpt_RT_translate_app |
| 4 | よこぼラボファイターズ | game | https://yokobo103.github.io/yokobo-lab-fighters/ | 20260522-lab-fighters | 20260515_よこぼファイターズ改 |
| 5 | 3Dボクセル研究施設ワールド | 3d-ar | https://yokobo103.github.io/yokobo_ai_lab_3d_boxel_world/ | 20260530-rpg-style-3d-research-facility | 20260526_RPG風の研究施設をつくる |
| 6 | よこぼ オープンワールド（Fable製） | 3d-ar | https://yokobo103.github.io/3D_yokobo_open_world_fable/ | 20260618-claude-fable-open-world | 20260612_fableで最強3Dゲームを作る |
| 7 | AI-Lab-Site（旧サイト + ARデモ集） | web | https://yokobo103.github.io/AI-Lab-Site/ | f5e0a374-44e9-4f89-beec-b53e62bc9a1f | old-ai-lab |

- `status` は全件 `"live"`、`addedAt` は `localSource` の日付（YYYY-MM-DD）を使う
- `summary` / `tags` は対応する発見ログ（`relatedPostId`）の要約・タグから持ってくると手早い
- category は上表が推奨。最終判断はよこぼ／Codexで微調整可（5/6を game にするのもあり）

---

## 4. 画面構成（上から下）

```
┌─ SiteHeader（既存・ナビに「体験格納庫」追加）
├─ ① ヒーロー（LAB ARCHIVE 看板）
├─ ② フィルタ&ソートバー（sticky）
├─ ③ 体験カードグリッド
├─ ④「体験格納庫って？」4つの価値アイコン
├─ ⑤「格納庫の使い方」3ステップ
├─ ⑥「研究メモ（Dr.よこぼ）」
└─ SiteFooter（既存）
```

### ① ヒーロー
- 横長バナー。背景＝木目の書架＋淡い青の魔法光。左に大きく **「体験格納庫」**、その上に英字 **`LAB ARCHIVE`**（角丸の木札プレート風）
- リード文（モックアップ準拠・微調整可）：
  > ゲーム・AIツール・3D・Webプロトタイプまで。よこぼのAIラボで生まれ、公開された「体験」を格納しています。気になる箱をめくって、遊んで、ひらめきを持ち帰ろう。
- 右側に**Dr.よこぼ（眼鏡の猫博士）＋ニャビット（ロボ）**のイラスト（アセット要・5章）
- CTAボタン2つ：
  - **`ランダムで体験する`**（primary・温色）→ `status:"live"` からランダム1件を選び `playUrl` を別タブで開く
  - **`保存したものを見る`**（secondary）→ お気に入り（localStorage）だけに絞り込む
- 装飾：肉球マーク、きらめき、`YKB LAB` のスタンプ、蝋封シール（CSS擬似要素＋小SVGで軽量に）

### ② フィルタ&ソートバー（`position: sticky; top: header下`）
- 左：フィルタ・ピル（`すべて / ゲーム / ツール / 3D・AR / Web / 動画・音声 / プロトタイプ`）
  - 既存 `.logFilterPills` / `.logFilterPill`（`app/posts/post-list-page.tsx`）の見た目を踏襲しつつ、格納庫テーマ色に
  - URLクエリ連動：`/experience?category=game`。SSRで初期フィルタ、以降はクライアントで切替
- 右：ソート `<select>`（`新しい順`(default) / `番号順` / `タイトル順`）
- 件数表示：「全 N 箱」。お気に入り表示中は「保存した N 箱」

### ③ 体験カードグリッド（格納庫の主役）
- レイアウト：`postGrid wide` 相当のレスポンシブグリッド（後述ブレークポイント）
- **カード意匠＝「標本箱／旅行タグ」**：角丸、紙質の薄いテクスチャ、上辺に紐穴＋点線、ほんのり影、ホバーで少し浮く＋傾く（`transform: translateY(-4px) rotate(-.4deg)`）
- カード構成（上→下）：
  1. 左上 `No.0001`（手書き風・等幅）／右上 カテゴリchip（色分け）
  2. サムネイル（`next/image`・16:10・角丸・`status:"wip"`なら淡色＋「準備中」帯）
  3. タイトル（太字・2行まで）
  4. タグ（最大4・余りは `+N`）
  5. フッター：**`体験する ▶`**（primary・別タブ `playUrl`）／ **`関連ログ`**（`relatedPostId`あれば `/posts/[id]`へ）／ ♡お気に入りトグル
- `status:"wip"` は「体験する」を無効化（`aria-disabled`）し「準備中」表示
- カード全体はリンクにしない（内部に複数アクションがあるため）。キーボード操作可能に

### ④「体験格納庫って？」価値の4アイコン
横並び4枚（モックアップ準拠）：
1. 遊んで試す　2. ひらめきを拾う　3. ログを残す　4. 未来につなぐ
各：丸アイコン＋見出し＋1行説明。`/assets/experience/icons/` のSVG（5章）

### ⑤「格納庫の使い方」3ステップ
番号バッジ＋アイコン＋短文：
1. 気になる箱（カード）を選ぶ
2. 「体験する」で遊ぶ・触る
3. 「関連ログ」で作った経緯を読む

### ⑥「研究メモ（Dr.よこぼ）」※初稿（採用・よこぼ微調整可）
- 右にDr.よこぼのイラスト、左に手書きメモ風カード。
- **採用文（初稿）：**
  > ここは“完成品の展示室”じゃない。「やってみた」を箱に詰めて並べた、体験の標本庫だ。
  > うまくいったのも、途中で力尽きたのも、ぜんぶ手で触れる形で残してる。
  > 気になった箱を開けて、君のひらめきを一個、持って帰ってよ。
- 署名：`— Dr.よこぼ`（手書き風）＋ `YKB LAB` スタンプ
- **差し替え用 別案（短め）：**
  > 完成品じゃなくていい。“やってみた”を箱にして並べてる。開けて、遊んで、ひらめきを持って帰って。

---

## 5. アートディレクション / デザイントークン

### 既存トークン（`app/globals.css :root`・流用必須）
`--navy #082a63` / `--deep-navy #001f4e` / `--blue #1178ff` / `--sky #eaf6ff` / `--soft-blue #f4fbff` / `--line #d9e8fb` / `--text #112d61` / `--muted #5d7197` / `--pink #ff3f7b` / `--cream #fff3d7` / `--shadow`

### 体験格納庫 追加トークン（`:root` に追記、`--arc-` 接頭辞）
```css
--arc-wood:        #b3742e;  /* 書架・木札のベース */
--arc-wood-deep:   #7c4a16;  /* 木の影 */
--arc-parchment:   #fbf3e0;  /* カード紙地（cream寄り） */
--arc-glow:        #6db8ff;  /* 魔法の青い光 */
--arc-glow-soft:   rgba(109,184,255,.35);
--arc-stamp:       #d8533a;  /* スタンプ/蝋封の赤 */
--arc-gold:        #f4c150;  /* アクセント金 */
--arc-card-radius: 18px;
--arc-tag-radius:  26px;     /* 旅行タグ風の大きめ角丸 */
```
- カテゴリ色：game=`--pink`系 / tool=`--blue` / 3d-ar=teal / web=violet / av=orange / prototype=`--muted`。淡背景＋濃文字でchip化
- 配色方針：**ベースは既存サイトの紺×青**を維持しつつ、格納庫ゾーンだけ**木目＋羊皮紙＋金＋青い光**を重ねて「特別な部屋」感を出す（サイト全体から浮かないこと）
- フォント：既存の system-ui を継続。`No.0001` と見出し英字のみ等幅/手書き風で遊ぶ（Webフォント追加は任意・パフォーマンス優先で原則しない）
- 動き：`prefers-reduced-motion` を尊重。きらめきや浮遊は控えめ・GPU負荷低く

---

## 6. 必要アセット（Codexは未作成プレースホルダで実装可・後で差し替え）

`public/assets/experience/` 配下に配置：
- `hero/hero-experience.webp`：Dr.よこぼ＋ニャビット＋書架（ヒーロー）
- `hero/plate-lab-archive.webp` または CSSで木札プレート
- `icons/`：value-1〜4（遊ぶ/ひらめき/ログ/未来）, step-1〜3, stamp-ykb, wax-seal, paw
- `thumbs/`：各体験のサムネ（無い体験は `thumbs/placeholder.webp`）
- `decor/`：sparkle, bookshelf-texture, paper-texture（軽量PNG/SVG）

> アセット未到着でも実装を止めない：プレースホルダ（単色＋アイコン）で組み、後日 `published_index.json` のサムネ整備と合わせて差し替える。

---

## 7. コンポーネント分割（実装ガイド）

```
app/experience/page.tsx              … SSR。experiences読み込み→初期フィルタ→<ExperiencePage/>へ
app/experience/experience-page.tsx   … "use client"。フィルタ/ソート/ランダム/お気に入り状態
app/experience/experience-card.tsx   … 1枚のカード
lib/experiences.ts                   … 型・カテゴリ定義・readExperiences()・絞り込み/並び替え関数
data/experiences.json                … データ正本（サイト内・初版7件）
app/globals.css                      … .experience* クラス群＋--arc-トークン追記
```
- お気に入り：`localStorage` キー `yokobo-experience-favorites`（archiveNoの配列）。SSRと不整合を避けるためマウント後に読む
- 既存スタイル（`.section-shell` `.sectionTitle` `.postGrid` `.chip` `.aboutButton` 等）を可能な限り再利用

---

## 8. レスポンシブ / アクセシビリティ / パフォーマンス

- グリッド列数：≥1200px=4列 / 768–1199px=3列 / 480–767px=2列 / <480px=1列
- ヒーローはモバイルで縦積み（イラスト下・CTA横並び→縦）
- フィルタバーはモバイルで横スクロール可（ピルを `overflow-x:auto`）
- a11y：フィルタは `role="tablist"`/ボタン、カードのアクションは個別の `<a>`/`<button>`、画像 `alt` 必須、フォーカスリング維持、`prefers-reduced-motion` 対応
- 画像は `next/image`（`sizes` 指定）。ヒーローのみ `priority`、カードは遅延読み込み
- 外部 `playUrl` リンクは `target="_blank" rel="noopener noreferrer"`

---

## 9. 受け入れ条件（Doneの定義）

- [ ] `/experience` が表示され、ヘッダーナビ「体験格納庫」から到達できる
- [ ] `data/experiences.json`（初版**7件**）からカードが描画される
- [ ] カテゴリ絞り込み（URLクエリ連動）・ソート3種が動く
- [ ] 「体験する」で `playUrl` が別タブで開く
- [ ] 「ランダムで体験する」がliveからランダムに開く
- [ ] お気に入りトグルが効き、リロード後も保持され、「保存したものを見る」で絞れる
- [ ] `relatedPostId` ありで「関連ログ」が `/posts/[id]` へ飛ぶ
- [ ] モバイル/デスクトップで崩れない、`reduced-motion` で過剰演出が止まる
- [ ] `npm run build` と lint が通る
- [ ] 既存ページ・既存データ（posts.json等）を破壊していない

---

## 10. Codexへの分割タスク（1回1タスク）

> いきなり全部ではなく、この順で小さく。各完了後に動作確認。

1. **A. データ基盤**：`lib/experiences.ts`（型・カテゴリ・read/filter/sort）＋ `data/experiences.json`（**7件**・3章の表から作成）。UIなし、型チェックが通ること。
2. **B. 骨組み**：`/experience` ルート＋ナビ追加＋カードグリッド（無装飾）。フィルタ/ソート/カード描画まで。
3. **C. カード意匠**：標本箱/タグ風スタイル、chip色、ホバー、wip表示。
4. **D. ヒーロー＋CTA**：看板・リード・ランダム体験・保存導線。プレースホルダ画像可。
5. **E. 下部3セクション**：価値4アイコン／使い方3ステップ／研究メモ（6章の採用文）。
6. **F. 仕上げ**：お気に入りlocalStorage、レスポンシブ、a11y、reduced-motion、build/lint。
7. （任意・別タスク）**G. 同期自動化**：`scan_published.py` に `--emit-site-experiences` を追加し、linked のみから `experiences.json` を自動生成。

---

## 11. メモ（将来の拡張・今回はやらない）

- 未掲載4件（脱走パズル/コロコロニャビット/NARUTO/名刺）は、よこぼが掲載判断したら `experiences.json` に追記して格納庫へ昇格
- 体験のプレイ回数・反応（既存の投稿リアクション機構）を格納庫カードにも持たせる
- カテゴリ「動画・音声 / プロトタイプ」に該当物が増えたら空状態を実カードに置換
