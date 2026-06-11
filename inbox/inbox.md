# Inbox

作成日: 2026-06-11

## GitHub連携メモ

### 背景

スマホからChatGPTで「inbox作って、GitHubに上げといて」と頼むだけで、Yokobo AI Lab のリポジトリ内に思考ログを残せる運用を検討した。

現在、PCローカルでは `yokobo_ai_lab` リポジトリ内に `inbox/` フォルダを置いている。ただし、スクショなど画像ファイルが多く含まれるため、意図的に `inbox/` 全体を `.gitignore` している。

一方で、`inbox/` は単なる一時メモではなく、記事作成・ポッドキャスト・ゲーム開発・AIラボ運用の素材として使う可能性がある。特に記事を書くためのプロンプトや思考の原石をここから拾うことがある。

### 考えたこと

`inbox/` 全体をGit管理から外すのではなく、画像ファイルだけ除外し、MarkdownなどのテキストファイルはGitHubに上げる運用にするとよさそう。

これにより、PCローカルだけでなくスマホからもChatGPT経由でGitHub上にinboxを残せる可能性が出てくる。

### 方針案

- `repo`: `yokobo_ai_lab`
- `path`: `inbox/`
- MarkdownファイルはGitHub管理する
- 画像・スクショ類は `.gitignore` で除外する
- inboxは「研究ログの原石置き場」として扱う
- 記事化・ポッドキャスト化・設計書化できそうなものは、後から正式な場所へ昇格する

### .gitignore案

```gitignore
# inbox images
inbox/**/*.png
inbox/**/*.jpg
inbox/**/*.jpeg
inbox/**/*.webp
inbox/**/*.gif
inbox/**/*.heic
inbox/**/*.mp4
inbox/**/*.mov
```

必要なら、`inbox/screenshots/` のような画像専用フォルダを作って、そこだけ除外してもよい。

```gitignore
inbox/screenshots/
```

### 判断

今の運用なら、`inbox/` 全体を `.gitignore` する理由は薄れてきている。

むしろ、文章ファイルはGitHubに残した方が、あとから検索・参照・記事化・AIへの読み込みに使いやすい。

結論としては、

> MarkdownはGitHub管理、画像だけ除外

がかなりよさそう。
