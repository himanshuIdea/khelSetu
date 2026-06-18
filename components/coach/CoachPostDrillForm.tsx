"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, VideoIcon } from "@/components/academy/icons";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { PageBody } from "@/components/academy/shared";
import { UploadSpinner } from "@/components/coach/UploadSpinner";
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { api, ApiError } from "@/lib/api";
import {
  clearCoachPostDraft,
  readCoachPostDraft,
  validateCoachVideoFileClient,
  writeCoachPostDraft,
  type CoachPostDrillDraft,
} from "@/lib/coach-post-draft";
import { coachRoutes } from "@/lib/coach-nav";
import type { CoachMediaFilterOptions } from "@/lib/repositories/coach-media";

type CoachPostDrillFormProps = {
  academyId: string;
  filterOptions: CoachMediaFilterOptions;
};

type UploadPhase = "idle" | "uploading" | "preview_local" | "preview_remote" | "preview_error";

export function CoachPostDrillForm({ academyId, filterOptions }: CoachPostDrillFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredDraftRef = useRef(false);

  const [sportId, setSportId] = useState(filterOptions.sports[0]?.id ?? "");
  const [batchId, setBatchId] = useState("none");
  const [drillName, setDrillName] = useState("");
  const [description, setDescription] = useState("");
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
  const [success, setSuccess] = useState(false);
  const [posted, setPosted] = useState(false);
  const [publishToAcademy, setPublishToAcademy] = useState(false);

  const hasSports = filterOptions.sports.length > 0;

  const sportOptions = useMemo(
    () => filterOptions.sports.map((sport) => ({ value: sport.id, label: sport.name })),
    [filterOptions.sports]
  );

  const batchOptions = useMemo(() => {
    const batches =
      sportId === ""
        ? filterOptions.batches
        : filterOptions.batches.filter((batch) => batch.sportId === sportId);
    return [
      { value: "none", label: "All batches (optional)" },
      ...batches.map((batch) => ({ value: batch.id, label: batch.name })),
    ];
  }, [filterOptions.batches, sportId]);

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const buildDraft = useCallback(
    (): CoachPostDrillDraft => ({
      drillName,
      description,
      sportId,
      batchId,
      videoUrl: remoteUrl,
      objectKey,
      thumbnailGradient,
      contentType,
    }),
    [batchId, contentType, description, drillName, objectKey, remoteUrl, sportId, thumbnailGradient]
  );

  const persistDraft = useCallback(() => {
    if (posted) {
      return;
    }
    writeCoachPostDraft(academyId, buildDraft());
  }, [academyId, buildDraft, posted]);

  const scheduleDraftSave = useCallback(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      persistDraft();
    }, 300);
  }, [persistDraft]);

  const clearUploadState = useCallback(
    (options?: { keepFormFields?: boolean }) => {
      uploadAbortRef.current?.abort();
      uploadAbortRef.current = null;
      revokeBlobUrl();
      pendingFileRef.current = null;
      setRemoteUrl(null);
      setObjectKey(null);
      setThumbnailGradient(null);
      setContentType(null);
      setUseRemotePreview(false);
      setPlaybackReady(false);
      setUploadPhase("idle");
      if (!options?.keepFormFields) {
        setError(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [revokeBlobUrl]
  );

  const deleteRemoteUpload = useCallback(
    async (key: string | null) => {
      if (!key) {
        return;
      }
      try {
        await api.coach.media.deleteUpload(academyId, key);
      } catch {
        // Best-effort cleanup — don't block the UI.
      }
    },
    [academyId]
  );

  const applyDraft = useCallback(
    (draft: CoachPostDrillDraft) => {
      setDrillName(draft.drillName);
      setDescription(draft.description);
      setSportId(draft.sportId || filterOptions.sports[0]?.id || "");
      setBatchId(draft.batchId || "none");
      setThumbnailGradient(draft.thumbnailGradient);
      setContentType(draft.contentType);

      if (draft.videoUrl && draft.objectKey) {
        setRemoteUrl(draft.videoUrl);
        setObjectKey(draft.objectKey);
        setUseRemotePreview(true);
        setUploadPhase("preview_remote");
        setPlaybackReady(false);
        setDraftNotice("Draft restored. Checking video preview…");
      }
    },
    [filterOptions.sports]
  );

  useEffect(() => {
    if (restoredDraftRef.current) {
      return;
    }
    restoredDraftRef.current = true;
    const draft = readCoachPostDraft(academyId);
    if (draft) {
      applyDraft(draft);
    }
  }, [academyId, applyDraft]);

  useEffect(() => {
    scheduleDraftSave();
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [
    drillName,
    description,
    sportId,
    batchId,
    remoteUrl,
    objectKey,
    thumbnailGradient,
    contentType,
    scheduleDraftSave,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (posted || !objectKey) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [objectKey, posted]);

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
  const canPost =
    Boolean(remoteUrl && objectKey && playbackReady && !isUploading && !submitting && hasSports);

  async function uploadFile(file: File, replaceKey: string | null) {
    const validationError = validateCoachVideoFileClient(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setDraftNotice(null);
    setPlaybackReady(false);
    pendingFileRef.current = file;

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
      const uploaded = await api.coach.media.upload(academyId, file);

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

      const message = err instanceof ApiError ? err.message : "Upload failed.";
      setError(message);
      setUploadPhase("preview_error");
      setUseRemotePreview(false);
      setPlaybackReady(false);
    } finally {
      if (uploadAbortRef.current === abortController) {
        uploadAbortRef.current = null;
      }
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || isUploading) {
      return;
    }

    await uploadFile(file, objectKey);
  }

  async function handleRemoveVideo() {
    if (isUploading) {
      return;
    }

    const keyToDelete = objectKey;
    clearUploadState({ keepFormFields: true });
    await deleteRemoteUpload(keyToDelete);
    persistDraft();
  }

  async function handleRetryUpload() {
    if (!pendingFileRef.current || isUploading) {
      fileInputRef.current?.click();
      return;
    }

    await uploadFile(pendingFileRef.current, objectKey);
  }

  function handleVideoCanPlay() {
    if (useRemotePreview && remoteUrl) {
      setPlaybackReady(true);
      setUploadPhase("preview_remote");
      setError(null);
      setDraftNotice(null);
    }
  }

  function handleVideoError() {
    if (!useRemotePreview || !remoteUrl) {
      return;
    }

    setPlaybackReady(false);
    setUploadPhase("preview_error");
    setUseRemotePreview(false);
    setError(
      "Video uploaded but preview failed. Make your Supabase bucket public (or re-upload). Your draft is saved."
    );
    setDraftNotice(
      blobUrl
        ? "Showing local preview until remote playback works."
        : "Reloaded draft could not play — try re-uploading the video."
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!sportId || !drillName.trim() || !remoteUrl || !objectKey || !playbackReady) {
      setError("Sport, drill name, and a playable uploaded video are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.coach.media.createDrillPost(academyId, {
        sportId,
        batchId: batchId === "none" ? null : batchId,
        drillName: drillName.trim(),
        description: description.trim() || null,
        videoUrl: remoteUrl,
        thumbnailGradient,
        publishToAcademy,
      });

      setPosted(true);
      setSuccess(true);
      clearCoachPostDraft(academyId);
      clearUploadState();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post drill.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePostAnother() {
    setSuccess(false);
    setPosted(false);
    setDrillName("");
    setDescription("");
    setBatchId("none");
    setSportId(filterOptions.sports[0]?.id ?? "");
    clearUploadState();
    clearCoachPostDraft(academyId);
  }

  if (success) {
    return (
      <PageBody className="max-w-lg mx-auto w-full">
        <div className="flex flex-col items-center text-center py-10 px-4">
          <div className="w-16 h-16 rounded-[18px] bg-green-soft text-green flex items-center justify-center mb-4">
            <VideoIcon className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-ink mb-2">Drill posted</h1>
          <p className="text-[13px] text-muted mb-6 max-w-sm">
            Your reference video is live. Players in the selected batch can submit their reps for
            review.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link
              href={coachRoutes.media}
              className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-3 px-4 rounded-[10px] min-h-[44px] flex-1"
            >
              Open media hub
            </Link>
            <button
              type="button"
              onClick={handlePostAnother}
              className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-3 px-4 rounded-[10px] border border-line min-h-[44px] flex-1"
            >
              Post another
            </button>
          </div>
        </div>
      </PageBody>
    );
  }

  if (!hasSports) {
    return (
      <PageBody className="max-w-lg mx-auto w-full">
        <div className="bg-card border border-line rounded-(--radius) shadow-card p-6 text-center">
          <div className="text-[15px] font-semibold text-ink">No sport assignments yet</div>
          <p className="text-[13px] text-muted mt-2">
            Your academy admin must assign you to batches before you can post drills.
          </p>
        </div>
      </PageBody>
    );
  }

  return (
    <PageBody className="max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3 mb-5 min-w-0">
        <Link
          href={coachRoutes.home}
          className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink shrink-0 min-h-[44px] min-w-[44px]"
          aria-label="Back to home"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h1 className="text-[17px] font-bold text-ink">Post drill video</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
        <label className="block min-w-0">
          <span className="text-[12px] font-semibold text-muted block mb-2">Drill name</span>
          <input
            type="text"
            value={drillName}
            onChange={(event) => setDrillName(event.target.value)}
            placeholder="e.g. Single-leg takedown · 3 × 10"
            className="w-full min-h-[44px] rounded-[10px] border border-line bg-card px-3 text-[13px] text-ink"
            required
            disabled={isUploading}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <label className="block min-w-0">
            <span className="text-[12px] font-semibold text-muted block mb-2">Sport</span>
            <InlineSelect
              value={sportId}
              onChange={(value) => {
                setSportId(value);
                setBatchId("none");
              }}
              options={sportOptions}
              aria-label="Sport"
              className="w-full"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-[12px] font-semibold text-muted block mb-2">Batch</span>
            <InlineSelect
              value={batchId}
              onChange={setBatchId}
              options={batchOptions}
              aria-label="Batch"
              className="w-full"
            />
          </label>
        </div>

        <label className="block min-w-0">
          <span className="text-[12px] font-semibold text-muted block mb-2">Instructions</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Focus points for athletes…"
            className="w-full rounded-[10px] border border-line bg-card px-3 py-2.5 text-[13px] text-ink resize-y min-h-[88px]"
            disabled={isUploading}
          />
        </label>

        <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-[12px] font-semibold text-muted">Reference video</div>
            {objectKey && !isUploading && (
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="text-[12px] font-semibold text-red min-h-[44px] px-2"
              >
                Remove
              </button>
            )}
          </div>

          <div className="relative w-full mb-3 min-w-0">
            {showVideo ? (
              <InlineVideoPlayer
                src={previewSrc}
                posterGradient={thumbnailGradient}
                variant="preview"
                videoKey={previewSrc ?? "empty"}
                onCanPlay={handleVideoCanPlay}
                onLoadedData={handleVideoCanPlay}
                onError={handleVideoError}
                videoStyle={
                  !useRemotePreview && thumbnailGradient
                    ? { background: thumbnailGradient }
                    : undefined
                }
              />
            ) : (
              <div className="w-full h-[140px] rounded-xl border border-dashed border-line bg-surface flex flex-col items-center justify-center text-center px-4">
                <VideoIcon className="w-8 h-8 text-muted mb-2" />
                <p className="text-[12.5px] text-muted">Upload MP4, WebM, or MOV (max 50MB)</p>
              </div>
            )}

            {isUploading && <UploadSpinner />}
          </div>

          {playbackReady && remoteUrl && (
            <p className="text-[11.5px] text-green font-medium mb-3">Video ready to post</p>
          )}

          {draftNotice && (
            <p className="text-[11.5px] text-muted mb-3" role="status">
              {draftNotice}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={handleFileChange}
            className="sr-only"
            id="coach-drill-video"
            disabled={isUploading}
          />

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand text-white font-semibold text-[13px] py-3 px-4 rounded-[12px] min-h-[44px] disabled:opacity-60"
            >
              {!isUploading && <PlusIcon className="w-4 h-4" />}
              {isUploading
                ? "Uploading…"
                : remoteUrl || blobUrl
                  ? "Replace video"
                  : "Upload video"}
            </button>

            {uploadPhase === "preview_error" && pendingFileRef.current && (
              <button
                type="button"
                onClick={handleRetryUpload}
                disabled={isUploading}
                className="w-full inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-3 px-4 rounded-[12px] border border-line min-h-[44px] disabled:opacity-60"
              >
                Retry upload
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[12.5px] text-red font-medium" role="alert">
            {error}
          </p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={publishToAcademy}
            onChange={(event) => setPublishToAcademy(event.target.checked)}
            className="mt-1 w-4 h-4 accent-brand"
          />
          <span>
            <span className="text-[12.5px] font-semibold text-ink block">Publish to academy</span>
            <span className="text-[12px] text-muted">
              Show on player feeds and Academy media. Leave unchecked to save as draft.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={!canPost}
          className="w-full inline-flex items-center justify-center bg-ink text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] min-h-[44px] disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post drill"}
        </button>
      </form>
    </PageBody>
  );
}
