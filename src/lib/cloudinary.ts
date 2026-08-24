import { v2 as cloudinary } from "cloudinary";

let configured = false;

function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "auto" = "auto",
  filename?: string
): Promise<{ url: string; publicId: string; type: string }> {
  const cld = getCloudinary();

  const cleanId = `jurgi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const ext = filename?.split(".").pop()?.toLowerCase();
  const formatMap: Record<string, string> = {
    mp4: "mp4", webm: "webm", mov: "mov", quicktime: "mov",
    "3gpp": "3gp", "3gp": "3gp", avi: "avi", m4v: "mp4",
    ogg: "ogg", mkv: "mkv",
  };
  const format = ext ? formatMap[ext] : undefined;

  return new Promise((resolve, reject) => {
    const options: Record<string, any> = {
      folder: `jurgi/${folder}`,
      resource_type: resourceType,
      public_id: cleanId,
      unique_filename: true,
    };
    if (format) options.format = format;

    const uploadStream = cld.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type: result.resource_type,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId);
}
