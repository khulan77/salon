import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Uploads live outside /public so they can sit on a mounted persistent disk
// (Render) and are served by the /uploads/[file] route handler.
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Saves an uploaded image to /public/uploads and returns its public path
 * (e.g. "/uploads/ab12.jpg"). Returns null if there's no valid file.
 */
export async function saveImage(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("Зургийн хэмжээ 5MB-с ихгүй байх ёстой.");
  const ext = EXT[file.type];
  if (!ext) throw new Error("Зөвхөн JPG, PNG, WEBP, GIF зураг оруулна уу.");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID().slice(0, 12)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

/** Best-effort delete of a previously uploaded image by its public path. */
export async function deleteImage(publicPath?: string): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const name = path.basename(publicPath); // guard against traversal
  try {
    await fs.unlink(path.join(UPLOAD_DIR, name));
  } catch {
    // already gone — ignore
  }
}
