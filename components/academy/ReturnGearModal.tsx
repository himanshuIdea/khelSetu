"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { InlineFieldGroup, InlineInput } from "@/components/academy/InlineFormFields";
import { api, ApiError } from "@/lib/api";
import type { OpenGearIssue } from "@/lib/inventory";

type ReturnGearModalProps = {
  academyId: string;
  issue: OpenGearIssue | null;
  open: boolean;
  onClose: () => void;
};

export function ReturnGearModal({ academyId, issue, open, onClose }: ReturnGearModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!issue || !open) return;
    setQuantity(String(issue.outstandingQuantity));
    setNotes("");
    setError(null);
  }, [issue, open]);

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

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!issue || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.inventory.returnGear(academyId, {
        issueMovementId: issue.issueId,
        quantity: Number(quantity),
        notes: notes.trim() || null,
      });

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!open || !issue) return null;

  const qty = Number(quantity);
  const canSubmit =
    Number.isInteger(qty) && qty >= 1 && qty <= issue.outstandingQuantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close return gear dialog"
        onClick={handleClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white rounded-(--radius) shadow-card border border-line"
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-ink tracking-tight">Mark gear returned</h2>
          <p className="text-[13px] text-muted mt-1 leading-relaxed">
            <b className="text-text">{issue.itemName}</b> issued to{" "}
            <b className="text-text">{issue.playerName}</b> —{" "}
            <b className="text-text">{issue.outstandingQuantity}</b> outstanding
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <InlineFieldGroup>
            <InlineInput
              label="Return quantity"
              id={id("quantity")}
              type="number"
              min={1}
              max={issue.outstandingQuantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
            <InlineInput
              label="Notes (optional)"
              id={id("notes")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Condition on return, etc."
            />
          </InlineFieldGroup>

          {error && (
            <p className="text-[13px] font-medium text-red" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Confirm return"}
          </button>
        </div>
      </form>
    </div>
  );
}
