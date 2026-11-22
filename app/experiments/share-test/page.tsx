"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultOgpImagePath as IMAGE_PATH } from "@/lib/ogp";

// 宣伝室フェーズ0: スマホのシェア機能でX投稿に画像と文章が渡るかを確かめる試作ページ。
// docs/2026-07-26_promo-room-plan.md のフェーズ0にあたる。本番の宣伝室では
// ここで動いた方式をそのまま採用する。

// 動画はGitHubに置かない方針なので、外（R2など）のURLを入れて試す。
// 一度入れたURLは端末に覚えさせて、次に開いたときは入力しなくていいようにする。
const VIDEO_URL_KEY = "share-test-video-url";
const SHARE_URL = "https://yokobo-ai-lab.vercel.app/";
const SHARE_TEXT = [
  "【シェアの練習】よこぼのAIラボ、絶賛実験中です。",
  "この文章が見えていたら文章の受け渡しは成功。",
].join("\n");

type Support = "checking" | "yes" | "no";

export default function ShareTestPage() {
  const [shareSupport, setShareSupport] = useState<Support>("checking");
  const [fileSupport, setFileSupport] = useState<Support>("checking");
  const [webpFile, setWebpFile] = useState<File | null>(null);
  const [jpegFile, setJpegFile] = useState<File | null>(null);
  const [prepError, setPrepError] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");

  const addLog = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 8));
  }, []);

  // 画像はページを開いた時点で用意しておく。ボタンを押してから読み込むと、
  // iOSで「ユーザー操作から離れた」と判定されて共有が拒否されることがあるため。
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
      setShareSupport(canShare ? "yes" : "no");

      try {
        const response = await fetch(IMAGE_PATH);
        if (!response.ok) throw new Error(`画像の取得に失敗 (${response.status})`);
        const blob = await response.blob();
        if (cancelled) return;

        const webp = new File([blob], "yokobo-ai-lab.webp", { type: "image/webp" });
        setWebpFile(webp);

        const canShareFiles =
          canShare && typeof navigator.canShare === "function"
            ? navigator.canShare({ files: [webp] })
            : false;
        setFileSupport(canShareFiles ? "yes" : "no");

        const jpeg = await toJpegFile(blob);
        if (cancelled) return;
        setJpegFile(jpeg);
      } catch (error) {
        if (cancelled) return;
        setFileSupport("no");
        setPrepError(error instanceof Error ? error.message : String(error));
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  // ?video=<URL> で開くか、枠に貼って「動画を用意する」を押すと使えるようになる。
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("video");
    const stored = window.localStorage.getItem(VIDEO_URL_KEY);
    setVideoUrl(fromQuery || stored || "");
  }, []);

  async function prepareVideo() {
    const url = videoUrl.trim();
    if (!url) {
      setVideoError("動画のURLを入れてください。");
      return;
    }

    setVideoLoading(true);
    setVideoError("");
    setVideoFile(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`取得に失敗 (${response.status})`);
      const blob = await response.blob();
      const name = url.split("/").pop()?.split("?")[0] || "yokobo-ai-lab.mp4";
      const file = new File([blob], name, { type: blob.type || "video/mp4" });
      setVideoFile(file);
      window.localStorage.setItem(VIDEO_URL_KEY, url);
      addLog(`動画の準備: 完了（${formatMb(file.size)}）`);
    } catch (error) {
      // 置き場所のCORS設定が足りないと、ここで「Failed to fetch」になる。
      const detail = error instanceof Error ? error.message : String(error);
      setVideoError(`${detail}（置き場所のCORS設定を確認してください）`);
      addLog(`動画の準備: 失敗 — ${detail}`);
    } finally {
      setVideoLoading(false);
    }
  }

  function saveVideo() {
    if (!videoFile) return;
    const objectUrl = URL.createObjectURL(videoFile);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = videoFile.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    addLog("方式W: 動画を端末に保存しました。Xアプリで手で添付してください");
  }

  async function runShare(label: string, files: File[] | null) {
    const payload: ShareData = { text: `${SHARE_TEXT}\n\n${SHARE_URL}` };
    if (files && files.length > 0) payload.files = files;

    if (typeof navigator.share !== "function") {
      addLog(`${label}: この端末は共有機能に対応していません`);
      return;
    }
    if (files && typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
      addLog(`${label}: この端末はこの形式の共有を受け付けませんでした`);
      return;
    }

    try {
      await navigator.share(payload);
      addLog(`${label}: 共有メニューを開きました`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        addLog(`${label}: 共有をキャンセルしました`);
        return;
      }
      addLog(`${label}: 失敗 — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function runFallback() {
    setShowRawText(true);
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n\n${SHARE_URL}`);
      addLog("方式D: 文章をコピーしました。画像の保存も始まります");
    } catch {
      addLog("方式D: 自動コピーできませんでした。下の枠から手でコピーしてください");
    }

    const link = document.createElement("a");
    link.href = IMAGE_PATH;
    link.download = "yokobo-ai-lab.webp";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const noShare = shareSupport === "no";
  const unusableReason = noShare ? "この端末では使えません（PCなど）" : "準備中…";

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.kicker}>宣伝室 フェーズ0</p>
        <h1 style={styles.title}>シェアの受け渡しテスト</h1>
        <p style={styles.lead}>
          スマホでこのページを開いて、下のボタンを上から順に試してください。Xアプリを選んだあと、
          <strong>画像と文章の両方が投稿画面に入っているか</strong>だけ見てもらえれば大丈夫です。
          実際に投稿する必要はありません。
        </p>

        <div style={styles.status}>
          <StatusLine label="共有機能" support={shareSupport} okText="使えます" ngText="使えません（方式Dへ）" />
          <StatusLine label="画像つき共有" support={fileSupport} okText="対応しています" ngText="非対応（方式Dへ）" />
          <p style={styles.statusLine}>
            <span style={styles.statusLabel}>画像の準備</span>
            <span style={{ ...styles.statusValue, color: webpFile && jpegFile ? "#1a7f4b" : "#8b8b8b" }}>
              {webpFile && jpegFile
                ? `完了（webp ${formatKb(webpFile.size)} / jpeg ${formatKb(jpegFile.size)}）`
                : "準備中…"}
            </span>
          </p>
          {prepError ? <p style={styles.error}>画像の準備でエラー: {prepError}</p> : null}
        </div>

        <img src={IMAGE_PATH} alt="テストに使う画像" style={styles.preview} />

        <div style={styles.buttons}>
          <ShareButton
            label="方式A"
            caption="webpのまま送る（本命）"
            disabled={!webpFile || noShare}
            disabledCaption={unusableReason}
            onClick={() => runShare("方式A", webpFile ? [webpFile] : null)}
          />
          <ShareButton
            label="方式B"
            caption="jpegに変換して送る"
            disabled={!jpegFile || noShare}
            disabledCaption={unusableReason}
            onClick={() => runShare("方式B", jpegFile ? [jpegFile] : null)}
          />
          <ShareButton
            label="方式C"
            caption="文章だけ送る（画像なし）"
            disabled={noShare}
            disabledCaption={unusableReason}
            onClick={() => runShare("方式C", null)}
          />
          <ShareButton
            label="方式D"
            caption="文章コピー＋画像を保存（最後の手段）"
            onClick={() => void runFallback()}
          />
        </div>

        <section style={styles.status}>
          <h2 style={styles.logTitle}>動画も試す（フェーズ2の下見）</h2>
          <p style={styles.videoNote}>
            動画はGitHubに置かないので、外に置いたURLを入れて試します。
            <strong>Xアプリが動画を受け取るか</strong>を見たいだけなので、投稿はしなくて大丈夫です。
          </p>
          <input
            type="url"
            inputMode="url"
            placeholder="https://.../cm-15s.mp4"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            style={styles.urlInput}
          />
          <p style={styles.statusLine}>
            <span style={styles.statusLabel}>動画の準備</span>
            <span style={{ ...styles.statusValue, color: videoFile ? "#1a7f4b" : "#8b8b8b" }}>
              {videoFile ? `完了（${formatMb(videoFile.size)}）` : videoLoading ? "読み込み中…" : "まだ"}
            </span>
          </p>
          {videoError ? <p style={styles.error}>{videoError}</p> : null}
        </section>

        <div style={styles.buttons}>
          <ShareButton
            label="動画を用意する"
            caption="URLから読み込む（先にこれ）"
            disabled={videoLoading || !videoUrl.trim()}
            disabledCaption={videoLoading ? "読み込み中…" : "URLを入れてください"}
            onClick={() => void prepareVideo()}
          />
          <ShareButton
            label="方式V"
            caption="動画を送る（本命）"
            disabled={!videoFile || noShare}
            disabledCaption={noShare ? unusableReason : "先に動画を用意してください"}
            onClick={() => runShare("方式V", videoFile ? [videoFile] : null)}
          />
          <ShareButton
            label="方式W"
            caption="動画を端末に保存（手で添付する用）"
            disabled={!videoFile}
            disabledCaption="先に動画を用意してください"
            onClick={saveVideo}
          />
        </div>

        {showRawText ? (
          <textarea
            readOnly
            value={`${SHARE_TEXT}\n\n${SHARE_URL}`}
            onFocus={(event) => event.currentTarget.select()}
            style={styles.rawText}
          />
        ) : null}

        <section style={styles.logBox}>
          <h2 style={styles.logTitle}>このページの動き</h2>
          {log.length === 0 ? (
            <p style={styles.logEmpty}>まだボタンが押されていません。</p>
          ) : (
            <ul style={styles.logList}>
              {log.map((line, index) => (
                <li key={`${line}-${index}`} style={styles.logItem}>
                  {line}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p style={styles.footer}>
          結果はチャットで「Aで画像も文章も入った」のように教えてください。それだけで本実装の方式が決まります。
        </p>
      </div>
    </main>
  );
}

function StatusLine({
  label,
  support,
  okText,
  ngText,
}: {
  label: string;
  support: Support;
  okText: string;
  ngText: string;
}) {
  const text = support === "checking" ? "確認中…" : support === "yes" ? okText : ngText;
  const color = support === "checking" ? "#8b8b8b" : support === "yes" ? "#1a7f4b" : "#b3261e";
  return (
    <p style={styles.statusLine}>
      <span style={styles.statusLabel}>{label}</span>
      <span style={{ ...styles.statusValue, color }}>{text}</span>
    </p>
  );
}

function ShareButton({
  label,
  caption,
  disabled,
  disabledCaption = "準備中…",
  onClick,
}: {
  label: string;
  caption: string;
  disabled?: boolean;
  disabledCaption?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles.button, ...(disabled ? styles.buttonDisabled : null) }}
    >
      <span style={styles.buttonLabel}>{label}</span>
      <span style={styles.buttonCaption}>{disabled ? disabledCaption : caption}</span>
    </button>
  );
}

function formatKb(bytes: number) {
  return `${Math.round(bytes / 1024)}KB`;
}

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function toJpegFile(blob: Blob): Promise<File> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvasを準備できませんでした");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!jpegBlob) throw new Error("jpegへの変換に失敗しました");

  return new File([jpegBlob], "yokobo-ai-lab.jpg", { type: "image/jpeg" });
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    padding: "24px 16px 64px",
    background: "#f4f2ee",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  kicker: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.14em",
    color: "#8a7f6d",
  },
  title: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.3,
    color: "#241f19",
  },
  lead: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#453d33",
  },
  status: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    border: "1px solid #e3ddd2",
  },
  statusLine: {
    margin: "4px 0",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
  },
  statusLabel: { color: "#6b6053" },
  statusValue: { fontWeight: 600 },
  error: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#b3261e",
    lineHeight: 1.6,
  },
  preview: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e3ddd2",
    display: "block",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  button: {
    width: "100%",
    minHeight: 64,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #241f19",
    background: "#241f19",
    color: "#fdfbf7",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    cursor: "pointer",
    textAlign: "left",
  },
  buttonDisabled: {
    background: "#c9c2b6",
    border: "1px solid #c9c2b6",
    color: "#6b6053",
    cursor: "default",
  },
  buttonLabel: { fontSize: 16, fontWeight: 700 },
  buttonCaption: { fontSize: 13, opacity: 0.85 },
  rawText: {
    width: "100%",
    minHeight: 110,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e3ddd2",
    background: "#fff",
    color: "#241f19",
    fontSize: 14,
    lineHeight: 1.7,
    resize: "vertical",
  },
  logBox: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    border: "1px solid #e3ddd2",
  },
  logTitle: {
    margin: "0 0 8px",
    fontSize: 14,
    color: "#6b6053",
  },
  videoNote: {
    margin: "0 0 10px",
    fontSize: 13,
    lineHeight: 1.8,
    color: "#453d33",
  },
  urlInput: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 8,
    borderRadius: 10,
    border: "1px solid #e3ddd2",
    background: "#fdfbf7",
    color: "#241f19",
    fontSize: 15,
  },
  logEmpty: { margin: 0, fontSize: 13, color: "#8a7f6d" },
  logList: { margin: 0, paddingLeft: 18 },
  logItem: { fontSize: 13, lineHeight: 1.8, color: "#453d33" },
  footer: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.8,
    color: "#6b6053",
  },
};
