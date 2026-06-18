import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  deleteFromSupabaseS3,
  getSupabaseS3Config,
  SUPABASE_COACH_MEDIA_BUCKET,
  uploadToSupabaseS3,
} from "@/lib/storage/supabase-s3";

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

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const THUMBNAIL_GRADIENTS = [
  "linear-gradient(135deg, #0E1B33, #1E335C)",
  "linear-gradient(135deg, #7C5CFC, #A78BFA)",
  "linear-gradient(135deg, #7a2d12, #FF6B2C)",
  "linear-gradient(135deg, #2F6BFF, #5B8DEF)",
];

export type SavedCoachMediaUpload = {
  url: string;
  objectKey: string;
  thumbnailGradient: string;
  contentType: string;
};

function pickThumbnailGradient(): string {
  return THUMBNAIL_GRADIENTS[Math.floor(Math.random() * THUMBNAIL_GRADIENTS.length)];
}

export function inferVideoContentType(fileName: string, mimeType?: string | null): string {
  const normalized = mimeType?.trim().toLowerCase();
  if (normalized && ALLOWED_MIME_TYPES.has(normalized)) {
    return normalized;
  }

  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "video/mp4";
}

function extensionForContentType(contentType: string): string {
  return EXT_BY_MIME[contentType] ?? ".mp4";
}

export function validateCoachVideoUpload(input: {
  fileName: string;
  mimeType?: string | null;
  size: number;
}) {
  const contentType = inferVideoContentType(input.fileName, input.mimeType);

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error("Unsupported video format. Use MP4, WebM, or MOV.");
  }

  if (input.size > MAX_BYTES) {
    throw new Error("Video must be 50MB or smaller.");
  }

  if (input.size <= 0) {
    throw new Error("Video file is empty.");
  }

  return contentType;
}

async function saveCoachMediaUploadLocally(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<SavedCoachMediaUpload> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "coach-media");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const objectKey = `uploads/coach-media/${filename}`;

  return {
    url: `/${objectKey}`,
    objectKey,
    thumbnailGradient: pickThumbnailGradient(),
    contentType,
  };
}

async function saveCoachMediaUploadToSupabase(
  buffer: Buffer,
  academyId: string,
  filename: string,
  contentType: string
): Promise<SavedCoachMediaUpload> {
  const objectKey = `coach-drills/${academyId}/${filename}`;

  const uploaded = await uploadToSupabaseS3({
    bucket: SUPABASE_COACH_MEDIA_BUCKET,
    key: objectKey,
    body: buffer,
    contentType,
  });

  return {
    url: uploaded.url,
    objectKey: uploaded.key,
    thumbnailGradient: pickThumbnailGradient(),
    contentType: uploaded.contentType,
  };
}

export async function saveCoachMediaUpload(
  file: File,
  academyId: string
): Promise<SavedCoachMediaUpload> {
  const contentType = validateCoachVideoUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  const ext = extensionForContentType(contentType);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const thumbnailGradient = pickThumbnailGradient();

  if (getSupabaseS3Config()) {
    const uploaded = await saveCoachMediaUploadToSupabase(
      buffer,
      academyId,
      filename,
      contentType
    );
    return { ...uploaded, thumbnailGradient };
  }

  const local = await saveCoachMediaUploadLocally(buffer, filename, contentType);
  return { ...local, thumbnailGradient };
}

export async function removeCoachMediaUpload(objectKey: string, academyId: string): Promise<void> {
  if (objectKey.startsWith("uploads/coach-media/")) {
    const localPath = path.join(process.cwd(), "public", objectKey);
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(localPath);
    } catch {
      // File may already be gone — ignore.
    }
    return;
  }

  if (!objectKey.startsWith(`coach-drills/${academyId}/`)) {
    throw new Error("Invalid upload path.");
  }

  await deleteFromSupabaseS3(SUPABASE_COACH_MEDIA_BUCKET, objectKey);
}
