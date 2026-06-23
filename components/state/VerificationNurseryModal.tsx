"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Pill } from "@/components/academy/shared";
import { AuthField } from "@/components/auth/AuthField";
import { SimpleConfirmDialog } from "@/components/academy/UnassignConfirmDialog";
import { FLAG_RESPONSE_LABELS, type StateNurseryDetail } from "@/lib/state-nurseries";
import { api, ApiError } from "@/lib/api";

type VerificationNurseryModalProps = {
  academyId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (nursery: StateNurseryDetail) => void;
  onRemoved?: (academyId: string) => void;
};

export function VerificationNurseryModal({
  academyId,
  open,
  onClose,
  onUpdated,
  onRemoved,
}: VerificationNurseryModalProps) {
  const router = useRouter();
  const [nursery, setNursery] = useState<StateNurseryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState("");
  const [flagGuidelines, setFlagGuidelines] = useState("");
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [confirmDeregister, setConfirmDeregister] = useState(false);
  const [confirmClearFlag, setConfirmClearFlag] = useState(false);
  const [submitting, setSubmitting] = useState<
    "flag" | "clear_flag" | "deregister" | "approve" | null
  >(null);

  useEffect(() => {
    if (!open || !academyId) {
      setNursery(null);
      setError(null);
      setShowFlagForm(false);
      setFlagNote("");
      setFlagGuidelines("");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api.state.nurseries
      .detail(academyId)
      .then((response) => {
        if (cancelled) return;
        if (!response.registered || !response.nursery) {
          setError("This academy is not registered as a state nursery.");
          setNursery(null);
        } else {
          setNursery(response.nursery);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load nursery details.");
        setNursery(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, academyId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleClose() {
    if (submitting) return;
    setConfirmDeregister(false);
    setConfirmClearFlag(false);
    setShowFlagForm(false);
    onClose();
  }

  async function handleFlag() {
    if (!academyId || submitting) return;
    if (!flagNote.trim() || !flagGuidelines.trim()) {
      setError("Flag note and guidelines are required.");
      return;
    }

    setSubmitting("flag");
    setError(null);

    try {
      const { nursery: updated } = await api.state.nurseries.flag(academyId, {
        note: flagNote.trim(),
        guidelines: flagGuidelines.trim(),
      });
      setNursery(updated);
      setShowFlagForm(false);
      onUpdated?.(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not flag nursery.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleClearFlag() {
    if (!academyId || submitting) return;

    setSubmitting("clear_flag");
    setError(null);

    try {
      const { nursery: updated } = await api.state.nurseries.clearFlag(academyId);
      setNursery(updated);
      setConfirmClearFlag(false);
      onUpdated?.(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not clear flag.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleApprove() {
    if (!academyId || submitting) return;

    setSubmitting("approve");
    setError(null);

    try {
      const { nursery: updated } = await api.state.nurseries.approve(academyId);
      setNursery(updated);
      onUpdated?.(updated);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve nursery.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeregister() {
    if (!academyId || submitting) return;

    setSubmitting("deregister");
    setError(null);

    try {
      await api.state.nurseries.deregister(academyId);
      setConfirmDeregister(false);
      onRemoved?.(academyId);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not deregister nursery.");
      setSubmitting(null);
    }
  }

  if (!open) return null;

  const isFlagged = nursery?.verificationStatus === "flagged";
  const isPending = nursery?.verificationStatus === "pending";
  const canFlag = nursery && nursery.verificationStatus === "verified";

  return (
    <>
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
          aria-labelledby="verification-nursery-title"
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-line rounded-2xl shadow-xl p-6 z-10"
          onClick={(event) => event.stopPropagation()}
        >
          {isLoading ? (
            <p className="text-[13px] text-muted py-8 text-center">Loading nursery details…</p>
          ) : error && !nursery ? (
            <div>
              <p className="text-[13px] font-medium text-red" role="alert">
                {error}
              </p>
              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
                >
                  Close
                </button>
              </div>
            </div>
          ) : nursery ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Avatar initials={nursery.initials} color={nursery.color} />
                <div className="min-w-0 flex-1">
                  <h2
                    id="verification-nursery-title"
                    className="text-lg font-bold text-ink tracking-tight"
                  >
                    {nursery.name}
                  </h2>
                  <p className="text-[13px] text-muted mt-1">{nursery.locationLabel}</p>
                  <div className="mt-2">
                    <Pill variant={nursery.status}>{nursery.statusLabel}</Pill>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div className="bg-surface border border-line2 rounded-[10px] px-3.5 py-2.5">
                  <div className="text-muted">District</div>
                  <div className="font-semibold text-ink mt-0.5">{nursery.district}</div>
                </div>
                <div className="bg-surface border border-line2 rounded-[10px] px-3.5 py-2.5">
                  <div className="text-muted">Athletes</div>
                  <div className="font-semibold text-ink mt-0.5">{nursery.athleteCount}</div>
                </div>
                <div className="col-span-2 bg-surface border border-line2 rounded-[10px] px-3.5 py-2.5">
                  <div className="text-muted">Sports</div>
                  <div className="font-semibold text-ink mt-0.5">
                    {nursery.sports.length > 0 ? nursery.sports.join(", ") : nursery.sportLabel}
                  </div>
                </div>
                <div className="col-span-2 bg-surface border border-line2 rounded-[10px] px-3.5 py-2.5">
                  <div className="text-muted">Registered on</div>
                  <div className="font-semibold text-ink mt-0.5">{nursery.registeredAt || "—"}</div>
                </div>
              </div>

              {nursery.admin && (
                <div className="border border-line rounded-[10px] px-4 py-3.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
                    Academy admin
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={nursery.admin.avatarInitials} color={nursery.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">
                        {nursery.admin.fullName}
                      </div>
                      <div className="text-[12px] text-muted">
                        {[nursery.admin.email, nursery.admin.phone].filter(Boolean).join(" · ") ||
                          "No contact on file"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isFlagged && nursery.flagNote && (
                <div className="rounded-[12px] border border-[#F6D4D4] bg-red-soft px-4 py-3 space-y-3">
                  <div>
                    <div className="text-[11px] uppercase font-semibold text-[#B5392F]">Flag note</div>
                    <p className="text-[13px] text-ink mt-1 whitespace-pre-wrap">{nursery.flagNote}</p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-semibold text-[#B5392F]">
                      Guidelines to resolve
                    </div>
                    <p className="text-[13px] text-ink mt-1 whitespace-pre-wrap">
                      {nursery.flagGuidelines}
                    </p>
                  </div>
                  {nursery.flagResponseStatus !== "none" && (
                    <div className="border-t border-[#F6D4D4] pt-3">
                      <div className="text-[11px] uppercase font-semibold text-muted">
                        Academy response
                      </div>
                      <p className="text-[13px] font-medium text-ink mt-1">
                        {FLAG_RESPONSE_LABELS[nursery.flagResponseStatus]}
                      </p>
                      {nursery.flagResponseNote ? (
                        <p className="text-[12.5px] text-muted mt-1 whitespace-pre-wrap">
                          {nursery.flagResponseNote}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {showFlagForm && canFlag && (
                <div className="space-y-3 border border-line rounded-[12px] p-4">
                  <AuthField
                    label="Flag note"
                    placeholder="Why is this nursery being flagged?"
                    value={flagNote}
                    onChange={(e) => setFlagNote(e.target.value)}
                  />
                  <AuthField
                    label="Guidelines to resolve"
                    placeholder="Steps the academy admin must follow to clear the flag"
                    value={flagGuidelines}
                    onChange={(e) => setFlagGuidelines(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() => void handleFlag()}
                      className="flex-1 min-h-[44px] rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
                    >
                      {submitting === "flag" ? "Flagging…" : "Confirm flag"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() => setShowFlagForm(false)}
                      className="min-h-[44px] px-4 rounded-[10px] border border-line text-[13px] font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {error && nursery ? (
                <p className="text-[13px] text-red" role="alert">
                  {error}
                </p>
              ) : null}

              {isPending && (
                <div className="rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] text-muted">
                  Review this nursery and admin details, then approve or reject the registration.
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-line2">
                {isPending && (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() => void handleApprove()}
                      className="w-full min-h-[44px] rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
                    >
                      {submitting === "approve" ? "Approving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(submitting)}
                      onClick={() => setConfirmDeregister(true)}
                      className="w-full min-h-[44px] rounded-[10px] border border-[#F6D4D4] bg-[#FEF2F2] text-red text-[13px] font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {canFlag && !showFlagForm && (
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => {
                      setError(null);
                      setShowFlagForm(true);
                    }}
                    className="w-full min-h-[44px] rounded-[10px] border border-[#F6D4D4] bg-red-soft text-[#B5392F] text-[13px] font-semibold disabled:opacity-50"
                  >
                    Flag nursery
                  </button>
                )}
                {isFlagged && (
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => setConfirmClearFlag(true)}
                    className="w-full min-h-[44px] rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
                  >
                    Clear flag
                  </button>
                )}
                {!isPending && (
                  <button
                    type="button"
                    disabled={Boolean(submitting)}
                    onClick={() => setConfirmDeregister(true)}
                    className="w-full min-h-[44px] rounded-[10px] border border-red/30 text-red text-[13px] font-semibold disabled:opacity-50"
                  >
                    Deregister nursery
                  </button>
                )}
                <button
                  type="button"
                  disabled={Boolean(submitting)}
                  onClick={handleClose}
                  className="w-full min-h-[44px] rounded-[10px] border border-line text-[13px] font-semibold disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <SimpleConfirmDialog
        open={confirmDeregister}
        title={isPending ? "Reject nursery?" : "Deregister nursery?"}
        description={
          isPending
            ? `Rejecting removes state recognition for ${nursery?.name ?? "this nursery"}. The academy record stays in the database.`
            : `This removes state recognition for ${nursery?.name ?? "this nursery"}. The academy admin will be sent to onboarding to resubmit registration, and the portal becomes view-only until the state approves again.`
        }
        isSubmitting={submitting === "deregister"}
        onCancel={() => setConfirmDeregister(false)}
        onConfirm={() => void handleDeregister()}
      />

      <SimpleConfirmDialog
        open={confirmClearFlag}
        title="Clear flag?"
        description={`Mark ${nursery?.name ?? "this nursery"} as verified and remove the active flag.`}
        isSubmitting={submitting === "clear_flag"}
        onCancel={() => setConfirmClearFlag(false)}
        onConfirm={() => void handleClearFlag()}
      />
    </>
  );
}
