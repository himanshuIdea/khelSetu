import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  getSupabaseS3Config,
  SUPABASE_ACADEMY_VERIFICATION_BUCKET,
  uploadToSupabaseS3,
} from "@/lib/storage/supabase-s3";
import type { OnboardingDocumentType } from "@/lib/academy-onboarding";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export type SavedVerificationDocument = {
  objectKey: string;
  contentType: string;
};

function inferContentType(fileName: string, mimeType?: string | null): string {
  const normalized = mimeType?.trim().toLowerCase();
  if (normalized && ALLOWED_MIME_TYPES.has(normalized)) {
    return normalized;
  }

  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/pdf";
}

function extensionForContentType(contentType: string): string {
  return EXT_BY_MIME[contentType] ?? ".pdf";
}

export function validateVerificationDocumentUpload(input: {
  fileName: string;
  mimeType?: string | null;
  size: number;
}) {
  const contentType = inferContentType(input.fileName, input.mimeType);

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error("Unsupported file format. Use JPG, PNG, WebP, or PDF.");
  }

  if (input.size > MAX_BYTES) {
    throw new Error("Document must be 10MB or smaller.");
  }

  if (input.size <= 0) {
    throw new Error("Document file is empty.");
  }

  return contentType;
}

async function saveVerificationDocumentLocally(
  buffer: Buffer,
  userId: string,
  docType: OnboardingDocumentType,
  filename: string
): Promise<SavedVerificationDocument> {
  const relativeDir = path.join("uploads", "academy-verification", userId, docType);
  const uploadDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return {
    objectKey: `${relativeDir}/${filename}`.replace(/\\/g, "/"),
    contentType: inferContentType(filename),
  };
}

async function saveVerificationDocumentToSupabase(
  buffer: Buffer,
  userId: string,
  docType: OnboardingDocumentType,
  filename: string,
  contentType: string
): Promise<SavedVerificationDocument> {
  const objectKey = `onboarding/${userId}/${docType}/${filename}`;

  await uploadToSupabaseS3({
    bucket: SUPABASE_ACADEMY_VERIFICATION_BUCKET,
    key: objectKey,
    body: buffer,
    contentType,
    verifyPublicAccess: false,
  });

  return { objectKey, contentType };
}

export async function saveVerificationDocument(
  file: File,
  userId: string,
  docType: OnboardingDocumentType
): Promise<SavedVerificationDocument> {
  const contentType = validateVerificationDocumentUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  const ext = extensionForContentType(contentType);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (getSupabaseS3Config()) {
    return saveVerificationDocumentToSupabase(buffer, userId, docType, filename, contentType);
  }

  return saveVerificationDocumentLocally(buffer, userId, docType, filename);
}

export async function readVerificationDocument(
  objectKey: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (objectKey.startsWith("uploads/academy-verification/")) {
    const localPath = path.join(process.cwd(), "public", objectKey);
    const buffer = await readFile(localPath);
    const ext = path.extname(objectKey).toLowerCase();
    return {
      buffer,
      contentType: MIME_BY_EXT[ext] ?? "application/octet-stream",
    };
  }

  const config = getSupabaseS3Config();
  if (!config) {
    throw new Error("Document storage is not configured.");
  }

  const { GetObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const response = await client.send(
    new GetObjectCommand({
      Bucket: SUPABASE_ACADEMY_VERIFICATION_BUCKET,
      Key: objectKey,
    })
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Document could not be read.");
  }

  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}

export function isVerificationDocumentKeyForUser(objectKey: string, userId: string): boolean {
  if (objectKey.startsWith(`uploads/academy-verification/${userId}/`)) {
    return !objectKey.includes("..");
  }
  if (objectKey.startsWith(`onboarding/${userId}/`)) {
    return !objectKey.includes("..");
  }
  return false;
}
