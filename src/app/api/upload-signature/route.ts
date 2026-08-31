import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 500 });
    }

    const { type = "image" } = await req.json();
    const isVideo = type === "video";
    const timestamp = Math.round(Date.now() / 1000);

    const folder = isVideo ? "videos" : "images";
    // Resource_type n'est PAS signé par Cloudinary pour /auto/upload :
    // il est seulement passé dans le multipart. Signer uniquement les
    // paramètres présents dans la "string to sign" (folder + timestamp).
    const params: Record<string, string | number> = {
      timestamp,
      folder: `jurgi/${folder}`,
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: `jurgi/${folder}`,
      resourceType: isVideo ? "video" : "image",
    });
  } catch (e: any) {
    console.error("[UPLOAD-SIGNATURE]", e?.message || e);
    return NextResponse.json({ error: "Erreur lors de la génération de la signature" }, { status: 500 });
  }
}
