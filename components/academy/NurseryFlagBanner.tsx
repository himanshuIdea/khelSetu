"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthField } from "@/components/auth/AuthField";
import { FLAG_RESPONSE_LABELS, type AcademyNurseryFlag } from "@/lib/state-nurseries";
import { api, ApiError } from "@/lib/api";

type NurseryFlagBannerProps = {
  academyId: string;
  flag: AcademyNurseryFlag;
};

export function NurseryFlagBanner({ academyId, flag: initialFlag }: NurseryFlagBannerProps) {
  const router = useRouter();
  const [flag, setFlag] = useState(initialFlag);
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState<"addressed" | "request_review" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFlag(initialFlag);
    if (initialFlag.flagResponseStatus === "none") {
      setResponseNote("");
      setSuccess(null);
      setError(null);
    }
  }, [initialFlag]);

  async function handleRespond(action: "addressed" | "request_review") {
    if (submitting) return;

    setSubmitting(action);
    setError(null);
    setSuccess(null);

    try {
      const { flag: updated } = await api.academy.nurseryFlag.respond(academyId, {
        action,
        note: responseNote.trim() || undefined,
      });
      setFlag(updated);
      setSuccess(
        action === "addressed"
          ? "Marked as addressed. State administrators will review your nursery."
          : "Review requested. State administrators have been notified."
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit response.");
    } finally {
      setSubmitting(null);
    }
  }

  const hasResponded = flag.flagResponseStatus !== "none";

  return (
    <div className="shrink-0 border-b border-[#F6D4D4] bg-red-soft px-4 sm:px-6 lg:px-[26px] py-4">
      <div className="max-w-full min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-[#B5392F]">State verification flag active</p>
            <p className="text-[12px] text-[#B5392F]/80 mt-0.5">
              Your nursery is flagged until the issues below are resolved.
            </p>
          </div>
          {hasResponded && flag.flagResponseStatus !== "none" && (
            <span className="inline-flex items-center min-h-[32px] px-3 rounded-full bg-white/70 text-[11px] font-semibold text-[#B5392F]">
              {FLAG_RESPONSE_LABELS[flag.flagResponseStatus]}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
          <div className="bg-white/60 border border-[#F6D4D4] rounded-[10px] px-3.5 py-2.5 min-w-0">
            <div className="text-[11px] uppercase font-semibold text-[#B5392F]">Flag note</div>
            <p className="text-ink mt-1 whitespace-pre-wrap">{flag.flagNote}</p>
          </div>
          <div className="bg-white/60 border border-[#F6D4D4] rounded-[10px] px-3.5 py-2.5 min-w-0">
            <div className="text-[11px] uppercase font-semibold text-[#B5392F]">
              Guidelines to resolve
            </div>
            <p className="text-ink mt-1 whitespace-pre-wrap">{flag.flagGuidelines}</p>
          </div>
        </div>

        {!hasResponded && (
          <div className="mt-3 space-y-3">
            <AuthField
              label="Response note (optional)"
              placeholder="Describe what you have done or plan to do"
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
            />

            {error ? (
              <p className="text-[13px] text-red" role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="text-[13px] text-[#0E9B72] font-medium" role="status">
                {success}
              </p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={Boolean(submitting)}
                onClick={() => void handleRespond("addressed")}
                className="flex-1 min-h-[44px] rounded-[10px] border border-line bg-white text-[13px] font-semibold text-ink disabled:opacity-50"
              >
                {submitting === "addressed" ? "Saving…" : "Mark as addressed"}
              </button>
              <button
                type="button"
                disabled={Boolean(submitting)}
                onClick={() => void handleRespond("request_review")}
                className="flex-1 min-h-[44px] rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {submitting === "request_review" ? "Submitting…" : "Request review"}
              </button>
            </div>
          </div>
        )}

        {hasResponded && flag.flagResponseNote ? (
          <p className="mt-3 text-[12.5px] text-ink whitespace-pre-wrap">
            Your note: {flag.flagResponseNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
