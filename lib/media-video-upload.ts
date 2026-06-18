import path from "node:path";

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const VIDEO_EXT_BY_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export const VIDEO_MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export const THUMBNAIL_GRADIENTS = [
  "linear-gradient(135deg, #0E1B33, #1E335C)",
  "linear-gradient(135deg, #7C5CFC, #A78BFA)",
  "linear-gradient(135deg, #7a2d12, #FF6B2C)",
  "linear-gradient(135deg, #2F6BFF, #5B8DEF)",
];

export function pickThumbnailGradient(): string {
  return THUMBNAIL_GRADIENTS[Math.floor(Math.random() * THUMBNAIL_GRADIENTS.length)];
}

export function inferVideoContentType(fileName: string, mimeType?: string | null): string {
  const normalized = mimeType?.trim().toLowerCase();
  if (normalized && ALLOWED_VIDEO_MIME_TYPES.has(normalized)) {
    return normalized;
  }

  const ext = path.extname(fileName).toLowerCase();
  return VIDEO_MIME_BY_EXT[ext] ?? "video/mp4";
}

export function extensionForVideoContentType(contentType: string): string {
  return VIDEO_EXT_BY_MIME[contentType] ?? ".mp4";
}

export function validateVideoUpload(input: {
  fileName: string;
  mimeType?: string | null;
  size: number;
}) {
  const contentType = inferVideoContentType(input.fileName, input.mimeType);

  if (!ALLOWED_VIDEO_MIME_TYPES.has(contentType)) {
    throw new Error("Unsupported video format. Use MP4, WebM, or MOV.");
  }

  if (input.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be 50MB or smaller.");
  }

  if (input.size <= 0) {
    throw new Error("Video file is empty.");
  }

  return contentType;
}
