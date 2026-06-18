export type CoachPostDrillDraft = {
  drillName: string;
  description: string;
  sportId: string;
  batchId: string;
  videoUrl: string | null;
  objectKey: string | null;
  thumbnailGradient: string | null;
  contentType: string | null;
};

export function coachPostDraftKey(academyId: string): string {
  return `khelsetu:coach-post-draft:${academyId}`;
}

export function readCoachPostDraft(academyId: string): CoachPostDrillDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(coachPostDraftKey(academyId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CoachPostDrillDraft;
  } catch {
    return null;
  }
}

export function writeCoachPostDraft(academyId: string, draft: CoachPostDrillDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(coachPostDraftKey(academyId), JSON.stringify(draft));
}

export function clearCoachPostDraft(academyId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(coachPostDraftKey(academyId));
}

const ALLOWED_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);
const MAX_BYTES = 50 * 1024 * 1024;

export function validateCoachVideoFileClient(file: File): string | null {
  const ext = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";

  const mimeOk =
    file.type === "video/mp4" ||
    file.type === "video/webm" ||
    file.type === "video/quicktime" ||
    file.type === "";

  if (!mimeOk && !ALLOWED_EXTENSIONS.has(ext)) {
    return "Unsupported video format. Use MP4, WebM, or MOV.";
  }

  if (file.size > MAX_BYTES) {
    return "Video must be 50MB or smaller.";
  }

  if (file.size <= 0) {
    return "Video file is empty.";
  }

  return null;
}
