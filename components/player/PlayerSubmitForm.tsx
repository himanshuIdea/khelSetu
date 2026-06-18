"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon, VideoIcon } from "@/components/academy/icons";
import { UploadSpinner } from "@/components/coach/UploadSpinner";
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { api, ApiError } from "@/lib/api";
import { playerLayout } from "@/lib/player-layout";
import { playerRoutes } from "@/lib/player-nav";
import {
  clearPlayerSubmitDraft,
  readPlayerSubmitDraft,
  validatePlayerVideoFileClient,
  writePlayerSubmitDraft,
  type PlayerSubmitDraft,
} from "@/lib/player-submit-draft";

type PlayerSubmitFormProps = {
  academyId: string;
  initialDrillName?: string;
  initialDrillPostId?: string | null;
};

type UploadPhase = "idle" | "uploading" | "preview_local" | "preview_remote" | "preview_error";

export function PlayerSubmitForm({
  academyId,
  initialDrillName = "",
  initialDrillPostId = null,
}: PlayerSubmitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredDraftRef = useRef(false);

  const [drillName, setDrillName] = useState(initialDrillName);
  const [drillPostId] = useState(initialDrillPostId);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [objectKey, setObjectKey] = useState<string | null>(null);
  const [thumbnailGradient, setThumbnailGradient] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [useRemotePreview, setUseRemotePreview] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [playbackReady, setPlaybackReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const buildDraft = useCallback(
    (): PlayerSubmitDraft => ({
      drillName,
      drillPostId,
      videoUrl: remoteUrl,
      objectKey,
      thumbnailGradient,
      contentType,
    }),
    [contentType, drillName, drillPostId, objectKey, remoteUrl, thumbnailGradient]
  );

  const persistDraft = useCallback(() => {
    if (submitted) {
      return;
    }
    writePlayerSubmitDraft(academyId, buildDraft());
  }, [academyId, buildDraft, submitted]);

  const scheduleDraftSave = useCallback(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      persistDraft();
    }, 300);
  }, [persistDraft]);

  const clearUploadState = useCallback(() => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    revokeBlobUrl();
    setRemoteUrl(null);
    setObjectKey(null);
    setThumbnailGradient(null);
    setContentType(null);
    setUseRemotePreview(false);
    setPlaybackReady(false);
    setUploadPhase("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [revokeBlobUrl]);

  const deleteRemoteUpload = useCallback(
    async (key: string | null) => {
      if (!key) {
        return;
      }
      try {
        await api.player.media.deleteUpload(academyId, key);
      } catch {
        // Best-effort cleanup.
      }
    },
    [academyId]
  );

  useEffect(() => {
    if (restoredDraftRef.current) {
      return;
    }
    restoredDraftRef.current = true;
    const draft = readPlayerSubmitDraft(academyId);
    if (draft) {
      setDrillName(draft.drillName || initialDrillName);
      setThumbnailGradient(draft.thumbnailGradient);
      setContentType(draft.contentType);
      if (draft.videoUrl && draft.objectKey) {
        setRemoteUrl(draft.videoUrl);
        setObjectKey(draft.objectKey);
        setUseRemotePreview(true);
        setUploadPhase("preview_remote");
        setDraftNotice("Draft restored. Checking video preview…");
      }
    }
  }, [academyId, initialDrillName]);

  useEffect(() => {
    scheduleDraftSave();
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [drillName, remoteUrl, objectKey, thumbnailGradient, contentType, scheduleDraftSave]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (submitted || !objectKey) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [objectKey, submitted]);

  useEffect(() => {
    return () => {
      revokeBlobUrl();
      uploadAbortRef.current?.abort();
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [revokeBlobUrl]);

  const previewSrc = useRemotePreview && remoteUrl ? remoteUrl : blobUrl;
  const showVideo = Boolean(previewSrc);
  const isUploading = uploadPhase === "uploading";
  const canSubmit =
    Boolean(
      drillName.trim() &&
        remoteUrl &&
        objectKey &&
        playbackReady &&
        !isUploading &&
        !submitting
    );

  async function uploadFile(file: File, replaceKey: string | null) {
    const validationError = validatePlayerVideoFileClient(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setDraftNotice(null);
    setPlaybackReady(false);

    revokeBlobUrl();
    const nextBlobUrl = URL.createObjectURL(file);
    blobUrlRef.current = nextBlobUrl;
    setBlobUrl(nextBlobUrl);
    setUseRemotePreview(false);
    setUploadPhase("preview_local");

    if (replaceKey) {
      await deleteRemoteUpload(replaceKey);
      setObjectKey(null);
      setRemoteUrl(null);
    }

    uploadAbortRef.current?.abort();
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;
    setUploadPhase("uploading");

    try {
      const uploaded = await api.player.media.upload(academyId, file);
      if (abortController.signal.aborted) {
        return;
      }

      setRemoteUrl(uploaded.url);
      setObjectKey(uploaded.objectKey);
      setThumbnailGradient(uploaded.thumbnailGradient);
      setContentType(uploaded.contentType);
      setUseRemotePreview(true);
      setUploadPhase("preview_remote");
      setPlaybackReady(false);
      persistDraft();
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      setUploadPhase("preview_error");
      setError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadFile(file, objectKey);
  }

  async function handleRemoveVideo() {
    const key = objectKey;
    clearUploadState();
    await deleteRemoteUpload(key);
    persistDraft();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !remoteUrl) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.player.media.createSubmission(academyId, {
        drillName: drillName.trim(),
        videoUrl: remoteUrl,
        drillPostId,
        thumbnailGradient,
      });
      clearPlayerSubmitDraft(academyId);
      setSubmitted(true);
      router.push(playerRoutes.home);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit drill.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PlayerScrollBody>
        <div className={playerLayout.centeredPanel}>
          <p className="text-[13px] text-muted">Submitted for coach review.</p>
        </div>
      </PlayerScrollBody>
    );
  }

  return (
    <PlayerScrollBody>
      <form onSubmit={handleSubmit} className="w-full min-w-0 flex flex-col gap-4">
        {draftNotice ? (
          <p className="text-[12px] text-brand font-medium">{draftNotice}</p>
        ) : null}
        {error ? <p className="text-[12px] text-red-600 font-medium">{error}</p> : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink">Drill name</span>
          <input
            type="text"
            value={drillName}
            onChange={(event) => setDrillName(event.target.value)}
            placeholder="e.g. Single-leg takedown"
            className="w-full min-h-[44px] rounded-[12px] border border-line px-3 text-[13px] text-ink bg-white"
            required
          />
        </label>

        <div className="w-full min-w-0">
          <span className="text-[12px] font-semibold text-ink block mb-1.5">Video</span>
          {showVideo ? (
            <div className="relative w-full aspect-[9/16] max-h-[320px] rounded-[16px] overflow-hidden border border-line bg-ink min-w-0">
              <InlineVideoPlayer
                src={previewSrc}
                posterGradient={thumbnailGradient}
                variant="preview"
                objectFit="cover"
                videoKey={previewSrc ?? "empty"}
                className="rounded-none max-h-none min-h-0 h-full"
                onCanPlay={() => setPlaybackReady(true)}
                onError={() => {
                  setPlaybackReady(false);
                  setUploadPhase("preview_error");
                  setError("Could not play video preview.");
                }}
              />
              {isUploading ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <UploadSpinner />
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[160px] rounded-[16px] border border-dashed border-line bg-surface flex flex-col items-center justify-center gap-2"
            >
              <VideoIcon className="w-8 h-8 text-brand" />
              <span className="text-[13px] font-semibold text-ink">Record or upload</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className="sr-only"
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap gap-2 mt-3">
            {!showVideo ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-brand text-white font-semibold text-[13px] min-h-[44px] py-2.5 px-4 rounded-[12px]"
              >
                <PlusIcon />
                Choose video
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-4 rounded-[12px] border border-line text-[13px] font-semibold text-ink"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="min-h-[44px] px-4 rounded-[12px] border border-line text-[13px] font-semibold text-red-600"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full min-h-[44px] rounded-[12px] bg-brand text-white font-semibold text-[13px] disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>

        <Link
          href="/player/ai-form"
          className="text-center text-[13px] font-semibold text-brand min-h-[44px] inline-flex items-center justify-center"
        >
          Run AI Form Check first →
        </Link>
      </form>
    </PlayerScrollBody>
  );
}
