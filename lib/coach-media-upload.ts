import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_BYTES = 50 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const THUMBNAIL_GRADIENTS = [
  "linear-gradient(135deg, #0E1B33, #1E335C)",
  "linear-gradient(135deg, #7C5CFC, #A78BFA)",
  "linear-gradient(135deg, #7a2d12, #FF6B2C)",
  "linear-gradient(135deg, #2F6BFF, #5B8DEF)",
];

export type SavedCoachMediaUpload = {
  url: string;
  thumbnailGradient: string;
};

export async function saveCoachMediaUpload(file: File): Promise<SavedCoachMediaUpload> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported video format. Use MP4, WebM, or MOV.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Video must be 50MB or smaller.");
  }

  const ext = EXT_BY_MIME[file.type] ?? ".mp4";
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "coach-media");

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const thumbnailGradient =
    THUMBNAIL_GRADIENTS[Math.floor(Math.random() * THUMBNAIL_GRADIENTS.length)];

  return {
    url: `/uploads/coach-media/${filename}`,
    thumbnailGradient,
  };
}
