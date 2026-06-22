"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/academy/shared";
import { AuthField } from "@/components/auth/AuthField";
import {
  ONBOARDING_REQUIRED_ACTIONS,
  ONBOARDING_STATUS_LABELS,
  onboardingStatusVariant,
  type AcademyOnboardingRequestDetail,
  type OnboardingRequiredAction,
} from "@/lib/academy-onboarding";
import { api, ApiError } from "@/lib/api";

type AcademyOnboardingRequestDetailModalProps = {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
  onReviewed?: (request: AcademyOnboardingRequestDetail) => void;
};

const ACTION_LABELS: Record<string, string> = {
  academy_name: "Academy name",
  district: "District",
  slug: "Branded link",
  sports: "Sports offered",
  funding_type: "Funding type",
  brand_color: "Brand colour",
  aadhar_number: "Aadhaar number",
  aadhar_document: "Aadhaar card",
  pan_number: "PAN number",
  pan_document: "PAN card",
  gst_number: "GST number",
  gst_document: "GST certificate",
};

type ReviewAction = "approve" | "needs_action" | "reject";

function isFinalized(status: AcademyOnboardingRequestDetail["status"]): boolean {
  return status === "approved" || status === "rejected";
}

export function AcademyOnboardingRequestDetailModal({
  requestId,
  open,
  onClose,
  onReviewed,
}: AcademyOnboardingRequestDetailModalProps) {
  const router = useRouter();
  const [request, setRequest] = useState<AcademyOnboardingRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedActions, setSelectedActions] = useState<OnboardingRequiredAction[]>([]);
  const [submitting, setSubmitting] = useState<ReviewAction | null>(null);

  useEffect(() => {
    if (!open || !requestId) {
      setRequest(null);
      setError(null);
      setSuccess(null);
      setSubmitting(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuccess(null);

    api.state.onboardingRequests
      .detail(requestId)
      .then(({ request: detail }) => {
        if (cancelled) return;
        setRequest(detail);
        setReviewNotes(detail.reviewNotes ?? "");
        setSelectedActions((detail.requiredActions as OnboardingRequiredAction[]) ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load request.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function handleReview(action: ReviewAction) {
    if (!requestId || submitting) return;

    if (action === "needs_action" && selectedActions.length === 0) {
      setError("Select at least one required action before requesting changes.");
      setSuccess(null);
      return;
    }

    setSubmitting(action);
    setError(null);
    setSuccess(null);

    try {
      const { request: updated } = await api.state.onboardingRequests.review(requestId, {
        action,
        reviewNotes: reviewNotes.trim() || undefined,
        requiredActions: action === "needs_action" ? selectedActions : undefined,
      });

      setRequest(updated);
      onReviewed?.(updated);
      router.refresh();

      if (action === "approve") {
        onClose();
        return;
      }

      if (action === "reject") {
        onClose();
        return;
      }

      setSuccess("Changes requested. The academy admin can update and resubmit their application.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Review action failed.");
    } finally {
      setSubmitting(null);
    }
  }

  function toggleAction(action: OnboardingRequiredAction) {
    setError(null);
    setSelectedActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action]
    );
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  const finalized = request ? isFinalized(request.status) : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-request-title"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card border border-line rounded-2xl shadow-xl z-10 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {loading ? (
          <p className="text-[13px] text-muted p-6">Loading request…</p>
        ) : request ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="onboarding-request-title" className="text-lg font-bold text-ink">
                  {request.academyName}
                </h2>
                <Pill variant={onboardingStatusVariant(request.status)}>
                  {ONBOARDING_STATUS_LABELS[request.status]}
                </Pill>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">Admin</div>
                  <div className="text-ink font-medium">{request.adminFullName}</div>
                </div>
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">District</div>
                  <div className="text-ink font-medium">{request.district}</div>
                </div>
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">Branded link</div>
                  <div className="text-ink font-medium">{request.slug}.khelsetu.in</div>
                </div>
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">Sports</div>
                  <div className="text-ink font-medium">{request.sports.join(", ")}</div>
                </div>
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">Aadhaar</div>
                  <div className="text-ink font-medium font-mono">{request.aadharNumber}</div>
                </div>
                <div>
                  <div className="text-muted text-[11px] uppercase font-semibold">PAN</div>
                  <div className="text-ink font-medium font-mono">{request.panNumber}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-muted text-[11px] uppercase font-semibold">GSTIN</div>
                  <div className="text-ink font-medium font-mono">{request.gstNumber}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["aadhar", "pan", "gst"] as const).map((type) => (
                  <a
                    key={type}
                    href={api.state.onboardingRequests.documentUrl(request.id, type)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center min-h-[40px] px-3 py-2 rounded-[10px] border border-line bg-surface text-[12px] font-semibold text-brand"
                  >
                    View {type.toUpperCase()} document
                  </a>
                ))}
              </div>

              {finalized ? (
                <div className="rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] text-muted">
                  This request is {ONBOARDING_STATUS_LABELS[request.status].toLowerCase()} and can no
                  longer be changed.
                  {request.reviewNotes ? (
                    <p className="mt-2 text-ink whitespace-pre-wrap">{request.reviewNotes}</p>
                  ) : null}
                </div>
              ) : (
                <>
                  <AuthField
                    label="Review notes"
                    placeholder="Notes for the academy admin"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />

                  <div className="space-y-3">
                    <div className="text-[12px] font-semibold text-ink">
                      Required actions (select before requesting changes)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ONBOARDING_REQUIRED_ACTIONS.map((action) => (
                        <label
                          key={action}
                          className="flex items-center gap-2 text-[12.5px] text-text cursor-pointer min-h-[36px]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedActions.includes(action)}
                            onChange={() => toggleAction(action)}
                          />
                          {ACTION_LABELS[action] ?? action}
                        </label>
                      ))}
                    </div>

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
                  </div>
                </>
              )}
            </div>

            {!finalized && (
              <div className="shrink-0 border-t border-line bg-card p-4 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => void handleReview("approve")}
                    className="flex-1 min-h-[44px] rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    {submitting === "approve" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => void handleReview("needs_action")}
                    className="flex-1 min-h-[44px] rounded-[10px] border border-line bg-card text-[13px] font-semibold disabled:opacity-50"
                  >
                    {submitting === "needs_action" ? "Saving…" : "Request changes"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => void handleReview("reject")}
                    className="flex-1 min-h-[44px] rounded-[10px] border border-[#F6D4D4] bg-[#FEF2F2] text-red text-[13px] font-semibold disabled:opacity-50"
                  >
                    {submitting === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[13px] text-muted p-6">Request not found.</p>
        )}

        {error && !request ? (
          <p className="px-6 pb-6 text-[13px] text-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
