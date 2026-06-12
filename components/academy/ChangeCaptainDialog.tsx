"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type ChangeCaptainDialogProps = {
  academyId: string;
  teamId: string;
  playerId: string | null;
  playerName: string | null;
  currentCaptainName: string | null;
  open: boolean;
  onClose: () => void;
};

export function ChangeCaptainDialog({
  academyId,
  teamId,
  playerId,
  playerName,
  currentCaptainName,
  open,
  onClose,
}: ChangeCaptainDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isSubmitting]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open || !playerId || !playerName) return null;

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.teams.updateMember(academyId, teamId, playerId!, { role: "captain" });
      onClose();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not update captain. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close change captain dialog"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-captain-title"
        className="relative w-full max-w-md bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
      >
        <h2 id="change-captain-title" className="text-xl font-bold text-ink tracking-tight">
          Change captain?
        </h2>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          You&apos;re assigning <b className="text-text">{playerName}</b> as captain.
          {currentCaptainName ? (
            <>
              {" "}
              <b className="text-text">{currentCaptainName}</b> will become a member.
            </>
          ) : null}{" "}
          Continue?
        </p>

        {error && (
          <p className="text-[13px] font-medium text-red mt-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
