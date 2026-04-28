import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword, makeSlug } from "@/lib/posts";

const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

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
      extension: "webp",
      contentType: "image/webp"
    };
  } catch {
    return {
      buffer,
      extension: "bin",
      contentType: "application/octet-stream"
    };
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminPassword(request.headers.get("x-admin-password"))) {
    return NextResponse.json({ message: "パスワードが違います。" }, { status: 401 });
  }

  const formData = await request.formData();
  const postId = makeSlug(String(formData.get("postId") || ""));
  const role = String(formData.get("role") || "gallery");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);

  if (!postId || files.length === 0) {
    return NextResponse.json({ message: "投稿IDと画像を選んでください。" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", postId);
  await fs.mkdir(uploadDir, { recursive: true });

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
    const filename = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    await fs.writeFile(path.join(uploadDir, filename), optimized.buffer);
    uploaded.push(`/uploads/${postId}/${filename}`);
  }

  return NextResponse.json({ images: uploaded });
}
