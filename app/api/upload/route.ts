import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isGitHubStorageEnabled, writeBufferToGitHub } from "@/lib/github-storage";
import { isAdminPassword, makeSlug } from "@/lib/posts";

export const runtime = "nodejs";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
const authError = { message: "パスワードが違います。再ログインしてください" };

async function optimizeImage(buffer: Buffer, role: string) {
  try {
    const sharpImport = await import("sharp");
    const sharp = sharpImport.default;
    const max = role === "thumbnail" ? 600 : 1600;
    return {
      buffer: await sharp(buffer)
        .rotate()
        .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      extension: "webp"
    };
  } catch {
    return {
      buffer,
      extension: "bin"
    };
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json(authError, { status: 401 });
  }

  const formData = await request.formData();
  const postId = makeSlug(String(formData.get("postId") || ""));
  const role = String(formData.get("role") || "gallery");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);

  if (!postId || files.length === 0) {
    return NextResponse.json({ message: "投稿IDと画像を選んでください。" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", postId);
  const saveToGitHub = isGitHubStorageEnabled();

  if (!saveToGitHub) {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    if (file.type.includes("heic") || file.type.includes("heif") || lowerName.endsWith(".heic") || lowerName.endsWith(".heif")) {
      return NextResponse.json(
        { message: "HEIC/HEIF画像は未対応です。JPEG/PNGに変換してからアップロードしてください。" },
        { status: 415 }
      );
    }

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "JPEG/PNG/WebP画像をアップロードしてください。" },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const optimized = await optimizeImage(Buffer.from(arrayBuffer), role);
    const fallbackExtension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const extension = optimized.extension === "bin" ? fallbackExtension : optimized.extension;
    const filename = `${role}-${globalThis.crypto.randomUUID()}.${extension}`;
    if (saveToGitHub) {
      await writeBufferToGitHub(
        `public/uploads/${postId}/${filename}`,
        optimized.buffer,
        `Upload ${role} image from admin`
      );
    } else {
      await fs.writeFile(path.join(uploadDir, filename), optimized.buffer);
    }
    uploaded.push(`/uploads/${postId}/${filename}`);
  }

  return NextResponse.json({ images: uploaded });
}
