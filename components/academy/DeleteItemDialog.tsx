"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { InventoryItem } from "@/lib/repositories/types";

type DeleteItemDialogProps = {
  academyId: string;
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
};

export function DeleteItemDialog({ academyId, item, open, onClose }: DeleteItemDialogProps) {
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

  if (!open || !item) return null;

  const blocked = item.issued > 0;

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (isSubmitting || blocked) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.inventory.deleteItem(academyId, item!.id);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close delete item dialog"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-item-title"
        className="relative w-full max-w-md bg-white rounded-(--radius) shadow-card border border-line px-6 py-6"
      >
        <h2 id="delete-item-title" className="text-xl font-bold text-ink tracking-tight">
          Delete inventory item?
        </h2>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          <b className="text-text">{item.name}</b> will be removed from your inventory.
          {blocked ? (
            <>
              {" "}
              This item cannot be deleted while <b className="text-text">{item.issued}</b> unit(s)
              are still issued.
            </>
          ) : (
            " This cannot be undone."
          )}
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
            disabled={isSubmitting || blocked}
            className="inline-flex items-center justify-center bg-red text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Deleting…" : "Delete item"}
          </button>
        </div>
      </div>
    </div>
  );
}
