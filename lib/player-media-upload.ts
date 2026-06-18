import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  extensionForVideoContentType,
  pickThumbnailGradient,
  validateVideoUpload,
} from "@/lib/media-video-upload";
import {
  deleteFromSupabaseS3,
  getSupabaseS3Config,
  SUPABASE_PLAYER_SUBMISSIONS_BUCKET,
  uploadToSupabaseS3,
} from "@/lib/storage/supabase-s3";

export type SavedPlayerMediaUpload = {
  url: string;
  objectKey: string;
  thumbnailGradient: string;
  contentType: string;
};

async function savePlayerMediaUploadLocally(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<SavedPlayerMediaUpload> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "player-submissions");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const objectKey = `uploads/player-submissions/${filename}`;

  return {
    url: `/${objectKey}`,
    objectKey,
    thumbnailGradient: pickThumbnailGradient(),
    contentType,
  };
}

async function savePlayerMediaUploadToSupabase(
  buffer: Buffer,
  academyId: string,
  filename: string,
  contentType: string
): Promise<SavedPlayerMediaUpload> {
  const objectKey = `player-submissions/${academyId}/${filename}`;

  const uploaded = await uploadToSupabaseS3({
    bucket: SUPABASE_PLAYER_SUBMISSIONS_BUCKET,
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

export async function savePlayerMediaUpload(
  file: File,
  academyId: string
): Promise<SavedPlayerMediaUpload> {
  const contentType = validateVideoUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  const ext = extensionForVideoContentType(contentType);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const thumbnailGradient = pickThumbnailGradient();

  if (getSupabaseS3Config()) {
    const uploaded = await savePlayerMediaUploadToSupabase(
      buffer,
      academyId,
      filename,
      contentType
    );
    return { ...uploaded, thumbnailGradient };
  }

  const local = await savePlayerMediaUploadLocally(buffer, filename, contentType);
  return { ...local, thumbnailGradient };
}

export async function removePlayerMediaUpload(objectKey: string, academyId: string): Promise<void> {
  if (objectKey.startsWith("uploads/player-submissions/")) {
    const localPath = path.join(process.cwd(), "public", objectKey);
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(localPath);
    } catch {
      // File may already be gone — ignore.
    }
    return;
  }

  if (!objectKey.startsWith(`player-submissions/${academyId}/`)) {
    throw new Error("Invalid upload path.");
  }

  await deleteFromSupabaseS3(SUPABASE_PLAYER_SUBMISSIONS_BUCKET, objectKey);
}
