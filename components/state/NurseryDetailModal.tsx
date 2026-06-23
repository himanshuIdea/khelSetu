"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Pill } from "@/components/academy/shared";
import { SimpleConfirmDialog } from "@/components/academy/UnassignConfirmDialog";
import { api, ApiError } from "@/lib/api";
import type { StateNurseryDetail } from "@/lib/state-nurseries";

type NurseryDetailModalProps = {
  academyId: string | null;
  open: boolean;
  onClose: () => void;
};

export function NurseryDetailModal({ academyId, open, onClose }: NurseryDetailModalProps) {
  const router = useRouter();
  const [nursery, setNursery] = useState<StateNurseryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting && !confirmOpen) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isSubmitting, confirmOpen]);

  useEffect(() => {
    if (!open || !academyId) {
      setNursery(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api.state.nurseries
      .detail(academyId)
      .then((response) => {
        if (cancelled) return;
        if (!response.registered) {
          setError("This academy is not registered as a state nursery.");
          setNursery(null);
        } else {
          setNursery(response.nursery);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load nursery details.");
        setNursery(null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, academyId]);

  function handleClose() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    onClose();
  }

  async function handleDeregister() {
    if (!academyId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.state.nurseries.deregister(academyId);
      setConfirmOpen(false);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not deregister nursery.");
      setIsSubmitting(false);
    }
  }

  if (!open || !academyId) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-ink/50"
          aria-label="Close nursery details"
          onClick={handleClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nursery-detail-title"
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
        >
          {isLoading ? (
            <p className="text-[13px] text-muted py-8 text-center">Loading nursery details…</p>
          ) : error ? (
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
            <>
              <div className="flex items-start gap-3">
                <Avatar initials={nursery.initials} color={nursery.color} />
                <div className="min-w-0 flex-1">
                  <h2 id="nursery-detail-title" className="text-xl font-bold text-ink tracking-tight">
                    {nursery.name}
                  </h2>
                  <p className="text-[13px] text-muted mt-1">{nursery.locationLabel}</p>
                  <div className="mt-2">
                    <Pill variant={nursery.status}>{nursery.statusLabel}</Pill>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 text-[12.5px]">
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
                <div className="mt-4 border border-line rounded-[10px] px-4 py-3.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted mb-2">
                    Academy admin
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={nursery.admin.avatarInitials} color={nursery.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{nursery.admin.fullName}</div>
                      <div className="text-[12px] text-muted">
                        {[nursery.admin.email, nursery.admin.phone].filter(Boolean).join(" · ") ||
                          "No contact on file"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 pt-2 border-t border-line2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center text-red font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-red/30 hover:bg-red/5 disabled:opacity-50"
                >
                  Deregister nursery
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <SimpleConfirmDialog
        open={confirmOpen}
        title="Deregister nursery?"
        description={
          nursery?.verificationStatus === "pending"
            ? `Rejecting removes state recognition for ${nursery?.name ?? "this nursery"}. The academy record stays in the database.`
            : `This removes state recognition for ${nursery?.name ?? "this nursery"}. The academy admin will be sent to onboarding to resubmit registration, and the portal becomes view-only until the state approves again.`
        }
        isSubmitting={isSubmitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleDeregister()}
      />
    </>
  );
}
