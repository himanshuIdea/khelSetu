"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageBody, Pill } from "@/components/academy/shared";
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { api, ApiError } from "@/lib/api";
import { coachRoutes } from "@/lib/coach-nav";
import type { CoachSubmissionDetail } from "@/lib/repositories/coach-media";

type CoachSubmissionReviewWorkspaceProps = {
  academyId: string;
  submission: CoachSubmissionDetail;
};

type CriteriaKey = "technique" | "speed" | "form";

const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  technique: "Technique",
  speed: "Speed",
  form: "Form & finish",
};

function CriteriaBar({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[12.5px] font-semibold text-text">{label}</span>
        <span className="text-[12px] font-bold text-ink">{value}/10</span>
      </div>
      {readOnly ? (
        <div className="h-2 rounded-full bg-line2 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${value * 10}%` }}
          />
        </div>
      ) : (
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(event) => onChange?.(Number(event.target.value))}
          className="w-full accent-brand min-h-[44px]"
          aria-label={`${label} score`}
        />
      )}
    </div>
  );
}

export function CoachSubmissionReviewWorkspace({
  academyId,
  submission,
}: CoachSubmissionReviewWorkspaceProps) {
  const router = useRouter();
  const isReviewed = submission.status === "reviewed" && submission.review != null;
  const existingReview = submission.review;

  const [rating, setRating] = useState(submission.review?.rating ?? 7);
  const [notes, setNotes] = useState(submission.review?.notes ?? "");
  const [criteria, setCriteria] = useState<Record<CriteriaKey, number>>({
    technique: submission.review?.criteriaScores?.technique ?? 7,
    speed: submission.review?.criteriaScores?.speed ?? 7,
    form: submission.review?.criteriaScores?.form ?? 7,
  });
  const [publishToAcademy, setPublishToAcademy] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(submission.isPublished);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.coach.media.submitReview(academyId, submission.id, {
        rating,
        notes: notes.trim() || null,
        criteriaScores: criteria,
        publishToAcademy,
      });
      router.push(`${coachRoutes.media}?tab=reviewed`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePublish() {
    setPublishLoading(true);
    setError(null);
    try {
      await api.coach.media.setSubmissionPublished(academyId, submission.id, !isPublished);
      setIsPublished(!isPublished);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update publish status.");
    } finally {
      setPublishLoading(false);
    }
  }

  return (
    <PageBody className="max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3 mb-5 min-w-0">
        <Link
          href={coachRoutes.media}
          className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink shrink-0 min-h-[44px] min-w-[44px]"
          aria-label="Back to media"
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
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold text-ink truncate">{submission.drillName}</h1>
          <p className="text-[12px] text-muted truncate">
            {submission.playerName} · {submission.sportName}
            {submission.batchName ? ` · ${submission.batchName}` : ""}
          </p>
        </div>
        <Pill variant={submission.status === "pending" ? "amber" : "green"}>
          {submission.status === "pending" ? "Pending" : "Reviewed"}
        </Pill>
      </div>

      <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 mb-4 min-w-0">
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">
          Player submission
        </div>
        <InlineVideoPlayer
          src={submission.videoUrl}
          posterGradient={submission.thumbnailGradient}
          durationSeconds={submission.durationSeconds}
          tag={submission.sportName}
          variant="review"
          objectFit="contain"
          ariaLabel={`Play ${submission.drillName}`}
          className="mb-3"
        />
        <div className="text-[13px] text-muted">Submitted {submission.timeAgo}</div>
      </div>

      {isReviewed && existingReview ? (
        <div className="space-y-4 min-w-0">
          <div className="bg-brand-soft border border-[#FFD9C5] rounded-(--radius) p-4 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[12.5px] font-bold text-brand-d">Coach feedback</div>
              <div className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-full">
                <span className="text-[13px] font-bold text-ink">{existingReview.rating}</span>
                <span className="text-[10px] text-muted">/10</span>
              </div>
            </div>
            {existingReview.notes && (
              <p className="text-[12.5px] text-[#7a4a30] leading-relaxed mb-4">
                {existingReview.notes}
              </p>
            )}
            {(Object.keys(CRITERIA_LABELS) as CriteriaKey[]).map((key) => (
              <CriteriaBar
                key={key}
                label={CRITERIA_LABELS[key]}
                value={existingReview.criteriaScores?.[key] ?? existingReview.rating}
                readOnly
              />
            ))}
          </div>

          <div className="bg-card border border-line rounded-(--radius) shadow-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12.5px] font-bold text-ink">Academy feed</div>
                <p className="text-[12px] text-muted mt-1">
                  {isPublished
                    ? "This video is visible on player Home and Explore."
                    : "Not published to academy feeds yet."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={publishLoading}
                className={`min-h-[44px] px-4 rounded-[10px] text-[13px] font-semibold ${
                  isPublished
                    ? "border border-line text-red-600"
                    : "bg-brand text-white"
                } disabled:opacity-60`}
              >
                {publishLoading
                  ? "Saving…"
                  : isPublished
                    ? "Remove from academy"
                    : "Publish to academy"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-[12.5px] text-red font-medium" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-line rounded-(--radius) shadow-card p-4 min-w-0">
          <div className="text-[12.5px] font-bold text-ink mb-4">Submit review</div>

          <label className="block mb-4">
            <span className="text-[12px] font-semibold text-muted block mb-2">Overall rating</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="flex-1 accent-brand min-h-[44px]"
                aria-label="Overall rating"
              />
              <span className="text-[15px] font-bold text-ink w-10 text-right">{rating}/10</span>
            </div>
          </label>

          {(Object.keys(CRITERIA_LABELS) as CriteriaKey[]).map((key) => (
            <CriteriaBar
              key={key}
              label={CRITERIA_LABELS[key]}
              value={criteria[key]}
              onChange={(value) => setCriteria((prev) => ({ ...prev, [key]: value }))}
            />
          ))}

          <label className="block mb-4">
            <span className="text-[12px] font-semibold text-muted block mb-2">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Share specific feedback for the athlete…"
              className="w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] text-ink placeholder:text-muted2 resize-y min-h-[100px]"
            />
          </label>

          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={publishToAcademy}
              onChange={(event) => setPublishToAcademy(event.target.checked)}
              className="mt-1 w-4 h-4 accent-brand"
            />
            <span>
              <span className="text-[12.5px] font-semibold text-ink block">
                Publish to academy
              </span>
              <span className="text-[12px] text-muted">
                Show on player Home, Explore, and Academy media after review.
              </span>
            </span>
          </label>

          {error && (
            <p className="text-[12.5px] text-red font-medium mb-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center bg-ink text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] min-h-[44px] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </PageBody>
  );
}
