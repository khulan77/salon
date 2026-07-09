import { randomUUID } from "crypto";
import { supabaseService, UPLOAD_BUCKET } from "./supabase/service";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Uploads an image to the Supabase Storage "uploads" bucket and returns its
 * public URL. Returns null if there's no valid file.
 */
export async function saveImage(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Зургийн хэмжээ 5MB-с ихгүй байх ёстой.");
  const ext = EXT[file.type];
  if (!ext) throw new Error("Зөвхөн JPG, PNG, WEBP, GIF зураг оруулна уу.");

  const name = `${randomUUID().slice(0, 12)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const sb = supabaseService();
  const { error } = await sb.storage
    .from(UPLOAD_BUCKET)
    .upload(name, buffer, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Зураг хадгалахад алдаа гарлаа: ${error.message}`);

  const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(name);
  return data.publicUrl;
}

/** Best-effort delete of a previously uploaded image by its public URL. */
export async function deleteImage(publicUrl?: string): Promise<void> {
  if (!publicUrl) return;
  const marker = `/${UPLOAD_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const name = publicUrl.slice(idx + marker.length).split("?")[0];
  if (!name) return;
  try {
    await supabaseService().storage.from(UPLOAD_BUCKET).remove([name]);
  } catch {
    // already gone — ignore
  }
}
