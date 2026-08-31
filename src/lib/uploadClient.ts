export interface CloudinaryUploadResult {
  url: string;
}

export async function uploadDirectCloudinary(
  file: File,
  type: "image" | "video"
): Promise<CloudinaryUploadResult> {
  const signRes = await fetch("/api/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!signRes.ok) {
    const d = await signRes.json().catch(() => ({}));
    throw new Error(d.error || "Erreur de préparation de l'upload");
  }
  const sig = await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  fd.append("resource_type", sig.resourceType);

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

  const res = await fetch(endpoint, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || data.error || "Échec de l'upload");
  }
  return { url: data.secure_url };
}
