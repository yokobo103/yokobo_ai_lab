# posts.json 安全ルール

`data/posts.json` は投稿データのSSOT（唯一の正本）であり、公開中の投稿、URL、画像参照に影響する危険ファイルです。管理画面保存とローカル編集の両方で更新される可能性があるため、特に競合へ注意します。

## 編集前

Webサイトリポジトリで作業する前は、`data/posts.json` を直接編集しない場合も必ずpullします。可能なら `C:\Users\Yokob\playground\tools\git\` の共通PowerShellスクリプトを使います。未実装の場合は次を実行します。

```powershell
cd "C:\Users\Yokob\playground\20260428_webサイト刷新"
git status --short
git pull --rebase
node -e "JSON.parse(require('fs').readFileSync('data/posts.json','utf8')); console.log('posts.json OK')"
```

1. `git status --short` に出力がある場合はpullせず、作業を停止して未コミット変更を報告します。
2. 出力がない場合だけ `git pull --rebase` で、管理画面経由を含む最新コミットを取り込みます。
3. pull後に `data/posts.json` がJSONとしてparseできることを確認します。
4. コンフリクトが発生した場合は自動解決せず、停止して報告します。
5. 対象投稿と変更項目を限定し、大量整形だけの差分を避けます。

## 編集中・編集後

- コンフリクトマーカーを残しません。次の文字列が1つでもあれば作業を止めて解消します。

```text
<<<<<<<
=======
>>>>>>>
```

- `id` の重複がないことを確認します。
- 既存の `id`、`slug` 相当の識別子、公開済みURLを不用意に変えません。現在の公開詳細URLは投稿IDに依存するため、ID変更はURL変更として扱います。
- `thumbnail` と `images` の各パスが実在することを確認します。通常、投稿画像は `public/uploads/` 配下です。
- 管理画面経由コミットとローカル編集の競合に注意し、push直前にもremote更新と差分を確認します。
- インデント変更やキー順変更など、大量整形だけの変更を避けます。
- 編集後もJSONとしてparseできることを確認します。
- `posts.json` を触った場合は、完了報告に対象投稿、変更内容、チェック結果を明記します。

## 簡易チェック

JSON parse:

```powershell
node -e "JSON.parse(require('fs').readFileSync('data/posts.json','utf8')); console.log('posts.json OK')"
```

重複ID:

```powershell
node -e "const p=JSON.parse(require('fs').readFileSync('data/posts.json','utf8')); const d=p.map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i); if(d.length){console.error('duplicate ids:',[...new Set(d)]);process.exit(1)} console.log('post ids OK')"
```

コンフリクトマーカー:

```powershell
rg -n '^(<<<<<<<|=======|>>>>>>>)' data/posts.json
```

`rg` が何も出力せず終了コード1になる場合は、該当マーカーなしです。画像パスは投稿ごとに `thumbnail` と `images` を確認し、対応する `public/` 配下のファイルを照合します。
