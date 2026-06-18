export type PlayerSubmitDraft = {
  drillName: string;
  drillPostId: string | null;
  videoUrl: string | null;
  objectKey: string | null;
  thumbnailGradient: string | null;
  contentType: string | null;
};

export function playerSubmitDraftKey(academyId: string): string {
  return `khelsetu:player-submit-draft:${academyId}`;
}

export function readPlayerSubmitDraft(academyId: string): PlayerSubmitDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(playerSubmitDraftKey(academyId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PlayerSubmitDraft;
  } catch {
    return null;
  }
}

export function writePlayerSubmitDraft(academyId: string, draft: PlayerSubmitDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(playerSubmitDraftKey(academyId), JSON.stringify(draft));
}

export function clearPlayerSubmitDraft(academyId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(playerSubmitDraftKey(academyId));
}

const ALLOWED_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);
const MAX_BYTES = 50 * 1024 * 1024;

export function validatePlayerVideoFileClient(file: File): string | null {
  const ext = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";

  const mimeOk =
    file.type === "video/mp4" ||
    file.type === "video/webm" ||
    file.type === "video/quicktime" ||
    file.type === "";

  if (!mimeOk && !ALLOWED_EXTENSIONS.has(ext)) {
    return "Use MP4, WebM, or MOV video.";
  }

  if (file.size > MAX_BYTES) {
    return "Video must be 50MB or smaller.";
  }

  if (file.size <= 0) {
    return "Video file is empty.";
  }

  return null;
}
