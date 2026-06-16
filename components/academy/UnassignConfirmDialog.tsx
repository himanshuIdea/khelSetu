"use client";

import type { AffectedPlayer, BatchPrimaryPromotion, UnassignPayload } from "@/lib/coaches";

export type UnassignConfirmState = {
  title: string;
  description: string;
  payload: UnassignPayload;
  players: AffectedPlayer[];
  promotions: BatchPrimaryPromotion[];
};

type UnassignConfirmDialogProps = {
  open: boolean;
  state: UnassignConfirmState | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UnassignConfirmDialog({
  open,
  state,
  isSubmitting,
  onCancel,
  onConfirm,
}: UnassignConfirmDialogProps) {
  if (!open || !state) return null;

  const hasPlayers = state.players.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close confirmation"
        onClick={isSubmitting ? undefined : onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unassign-confirm-title"
        className="relative w-full max-w-md bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
      >
        <h3 id="unassign-confirm-title" className="text-lg font-bold text-ink">
          {state.title}
        </h3>
        <p className="text-[13px] text-muted mt-1.5">{state.description}</p>

        {hasPlayers && (
          <div className="mt-4 border border-line rounded-[10px] overflow-hidden">
            <div className="px-3.5 py-2 bg-surface/80 text-[11px] font-semibold text-muted uppercase tracking-wide">
              {state.players.length} player{state.players.length === 1 ? "" : "s"} affected
            </div>
            <ul className="max-h-[min(280px,40vh)] overflow-y-auto divide-y divide-line2">
              {state.players.map((player) => (
                <li
                  key={player.id}
                  className="px-3.5 py-2.5 text-[13px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5"
                >
                  <span className="font-semibold text-ink">{player.fullName}</span>
                  <span className="text-muted text-[12px]">
                    {player.sportName} · {player.batchName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.promotions.length > 0 && (
          <div className="mt-3 text-[12.5px] text-muted bg-surface border border-line2 rounded-[10px] px-3.5 py-2.5">
            {state.promotions.map((promotion) => (
              <p key={promotion.batchId}>
                <b className="text-ink">{promotion.batchName}</b> primary coach will change to{" "}
                <b className="text-ink">{promotion.promotedCoachName}</b>.
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-red text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Removing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

type SimpleConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SimpleConfirmDialog({
  open,
  title,
  description,
  isSubmitting,
  onCancel,
  onConfirm,
}: SimpleConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close confirmation"
        onClick={isSubmitting ? undefined : onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
      >
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="text-[13px] text-muted mt-1.5">{description}</p>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-red text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Removing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
