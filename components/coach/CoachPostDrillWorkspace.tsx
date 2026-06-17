"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { PlusIcon, VideoIcon } from "@/components/academy/icons";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { PageBody } from "@/components/academy/shared";
import { api, ApiError } from "@/lib/api";
import { coachRoutes } from "@/lib/coach-nav";
import type { CoachMediaFilterOptions } from "@/lib/repositories/coach-media";

type CoachPostDrillWorkspaceProps = {
  academyId: string;
  filterOptions: CoachMediaFilterOptions;
};

export function CoachPostDrillWorkspace({ academyId, filterOptions }: CoachPostDrillWorkspaceProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sportId, setSportId] = useState(filterOptions.sports[0]?.id ?? "");
  const [batchId, setBatchId] = useState("none");
  const [drillName, setDrillName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailGradient, setThumbnailGradient] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploaded = await api.coach.media.upload(academyId, file);
      setVideoUrl(uploaded.url);
      setThumbnailGradient(uploaded.thumbnailGradient);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
      setVideoUrl(null);
      setThumbnailGradient(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!sportId || !drillName.trim() || !videoUrl) {
      setError("Sport, drill name, and video are required.");
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
        videoUrl,
        thumbnailGradient,
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post drill.");
    } finally {
      setSubmitting(false);
    }
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
              onClick={() => {
                setSuccess(false);
                setDrillName("");
                setDescription("");
                setVideoUrl(null);
                setThumbnailGradient(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-3 px-4 rounded-[10px] border border-line min-h-[44px] flex-1"
            >
              Post another
            </button>
          </div>
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
          />
        </label>

        <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 min-w-0">
          <div className="text-[12px] font-semibold text-muted mb-3">Reference video</div>
          {videoUrl ? (
            <div
              className="w-full h-[180px] rounded-xl flex items-center justify-center mb-3"
              style={{ background: thumbnailGradient ?? "linear-gradient(135deg, #0E1B33, #1E335C)" }}
            >
              <VideoIcon className="w-10 h-10 text-white/90" />
            </div>
          ) : (
            <div className="w-full h-[140px] rounded-xl border border-dashed border-line bg-surface flex flex-col items-center justify-center mb-3 text-center px-4">
              <VideoIcon className="w-8 h-8 text-muted mb-2" />
              <p className="text-[12.5px] text-muted">Upload MP4, WebM, or MOV (max 50MB)</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="sr-only"
            id="coach-drill-video"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand text-white font-semibold text-[13px] py-3 px-4 rounded-[12px] min-h-[44px] disabled:opacity-60"
          >
            <PlusIcon className="w-4 h-4" />
            {uploading ? "Uploading…" : videoUrl ? "Replace video" : "Upload video"}
          </button>
        </div>

        {error && (
          <p className="text-[12.5px] text-red font-medium" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || uploading || !videoUrl}
          className="w-full inline-flex items-center justify-center bg-ink text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] min-h-[44px] disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post drill"}
        </button>
      </form>
    </PageBody>
  );
}
