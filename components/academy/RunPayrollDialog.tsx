"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CashIcon } from "@/components/academy/icons";
import { api, ApiError } from "@/lib/api";

type RunPayrollDialogProps = {
  academyId: string;
  open: boolean;
  monthLabel: string;
  onClose: () => void;
};

export function RunPayrollDialog({ academyId, open, monthLabel, onClose }: RunPayrollDialogProps) {
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

  if (!open) return null;

  async function handleConfirm() {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.payroll.run(academyId);
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
        aria-label="Close run payroll dialog"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-payroll-title"
        className="relative w-full max-w-sm bg-card border border-line rounded-(--radius) shadow-card p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-brand-soft text-brand-d flex items-center justify-center">
            <CashIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 id="run-payroll-title" className="text-[17px] font-bold text-ink">
              Run payroll for {monthLabel}?
            </h2>
            <p className="text-[12.5px] text-muted mt-0.5">
              Generates pending payslips for all staff using attendance days present.
            </p>
          </div>
        </div>

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
            className="min-h-[44px] flex-1 rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Running…" : "Run payroll"}
          </button>
        </div>
      </div>
    </div>
  );
}
