"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { InlineInput } from "@/components/academy/InlineFormFields";
import { CheckIcon } from "@/components/academy/icons";
import { api, ApiError } from "@/lib/api";
import type { StaffMember } from "@/lib/repositories/types";

type ApprovePayslipDialogProps = {
  academyId: string;
  staff: StaffMember | StaffMember[] | null;
  open: boolean;
  onClose: () => void;
};

export function ApprovePayslipDialog({
  academyId,
  staff,
  open,
  onClose,
}: ApprovePayslipDialogProps) {
  const router = useRouter();
  const fieldIds = useId();
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = staff ? (Array.isArray(staff) ? staff : [staff]) : [];
  const payslipIds = rows.map((row) => row.payslipId).filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (!open) {
      setPaymentReference("");
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

  if (!open || rows.length === 0) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || payslipIds.length === 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (payslipIds.length === 1) {
        await api.payroll.approvePayslip(academyId, payslipIds[0], {
          paymentReference: paymentReference.trim() || undefined,
        });
      } else {
        await api.payroll.bulkApprove(academyId, {
          payslipIds,
          paymentReference: paymentReference.trim() || undefined,
        });
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const title =
    rows.length === 1
      ? `Approve payslip for ${rows[0].name}?`
      : `Approve ${rows.length} payslips?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close approve payslip dialog"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-payslip-title"
        className="relative w-full max-w-sm bg-card border border-line rounded-(--radius) shadow-card p-5"
      >
        <h2 id="approve-payslip-title" className="text-[17px] font-bold text-ink">
          {title}
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          Marks selected payslips as paid. You can add an optional payment reference.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
          <InlineInput
            label="Payment reference (optional)"
            id={`${fieldIds}-ref`}
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="UPI ref, cheque no., etc."
          />

          {error && <p className="text-[12.5px] text-red">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] flex-1 rounded-[10px] border border-line bg-card text-[13px] font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              {isSubmitting ? "Approving…" : "Mark paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
