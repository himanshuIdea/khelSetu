"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { StaffMember } from "@/lib/repositories/types";

type DeleteStaffDialogProps = {
  academyId: string;
  staff: StaffMember | null;
  open: boolean;
  onClose: () => void;
};

export function DeleteStaffDialog({ academyId, staff, open, onClose }: DeleteStaffDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

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

  if (!open || !staff) return null;

  async function handleConfirm() {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.payroll.deleteStaff(academyId, staff!.staffId);
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
        aria-label="Close delete staff dialog"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-staff-title"
        className="relative w-full max-w-sm bg-card border border-line rounded-(--radius) shadow-card p-5"
      >
        <h2 id="delete-staff-title" className="text-[17px] font-bold text-ink">
          Delete staff member?
        </h2>
        <p className="text-[13px] text-muted mt-2">
          <span className="font-semibold text-ink">{staff.name}</span> will be removed from payroll.
          {staff.isCoach
            ? " Linked coach profile will also be deleted if no players are assigned."
            : null}
        </p>

        {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] flex-1 rounded-[10px] border border-line bg-card text-[13px] font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="min-h-[44px] flex-1 rounded-[10px] bg-red text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
