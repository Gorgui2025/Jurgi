import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/3gpp", "video/x-m4v", "video/x-msvideo", "video/avi", "video/mov", "video/3gp", "video/ogg"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Format non supporté. Images: jpg, png, webp, gif. Vidéos: mp4, webm, mov, 3gp." }, { status: 400 });
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: isVideo
          ? `Vidéo trop volumineuse (max ${MAX_VIDEO_SIZE / 1024 / 1024}Mo)`
          : `Image trop volumineuse (max ${MAX_IMAGE_SIZE / 1024 / 1024}Mo)`,
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isCloudinaryConfigured()) {
      const folder = isImage ? "images" : "videos";
      const result = await uploadToCloudinary(buffer, folder, isVideo ? "video" : "image", file.name);
      return NextResponse.json({
        url: result.url,
        type: isImage ? "image" : "video",
        size: file.size,
      });
    }

    const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      type: isImage ? "image" : "video",
      size: file.size,
    });
  } catch (e: any) {
    console.error("[UPLOAD]", e?.message || e);
    return NextResponse.json({ error: e?.message || "Erreur lors de l'upload" }, { status: 500 });
  }
}
