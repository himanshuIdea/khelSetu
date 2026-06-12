"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type RemovePlayerDialogProps = {
  academyId: string;
  playerId: string | null;
  playerName: string | null;
  open: boolean;
  onClose: () => void;
  onRemoved?: (playerId: string) => void;
};

export function RemovePlayerDialog({
  academyId,
  playerId,
  playerName,
  open,
  onClose,
  onRemoved,
}: RemovePlayerDialogProps) {
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
      await api.players.remove(academyId, playerId!);
      onRemoved?.(playerId!);
      onClose();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close remove player dialog"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-player-title"
        className="relative w-full max-w-md bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
      >
        <h2 id="remove-player-title" className="text-xl font-bold text-ink tracking-tight">
          Remove player?
        </h2>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          <b className="text-text">{playerName}</b> will be removed from your academy roster.
          This action cannot be undone from the players list.
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
            className="inline-flex items-center justify-center bg-red text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Removing…" : "Remove player"}
          </button>
        </div>
      </div>
    </div>
  );
}
