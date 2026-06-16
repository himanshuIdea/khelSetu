"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import { CheckIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import { todayDateString } from "@/lib/attendance";
import type { PlayerFeeBillingRow } from "@/lib/repositories/types";

type RecordFeePaymentModalProps = {
  academyId: string;
  invoices: PlayerFeeBillingRow[];
  open: boolean;
  onClose: () => void;
};

const METHOD_OPTIONS: DropdownOption[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer" },
];

export function RecordFeePaymentModal({
  academyId,
  invoices,
  open,
  onClose,
}: RecordFeePaymentModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const primary = invoices[0] ?? null;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "upi" | "bank">("upi");
  const [paidAt, setPaidAt] = useState(todayDateString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAmount = useMemo(() => {
    if (!primary) return "";
    return String(primary.amountPaise / 100);
  }, [primary]);

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      return;
    }
    setAmount(defaultAmount);
    setMethod("upi");
    setPaidAt(todayDateString());
    setError(null);
  }, [open, defaultAmount]);

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

  if (!open || invoices.length === 0) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    const rupees = Number(amount.replace(/[₹,\s]/g, ""));
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    const amountPaise = Math.round(rupees * 100);
    setError(null);
    setIsSubmitting(true);

    try {
      for (const invoice of invoices) {
        await api.fees.recordPayment(academyId, {
          invoiceId: invoice.id,
          amountPaise: invoice.amountPaise || amountPaise,
          method,
          paidAt,
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
    invoices.length === 1
      ? `Record payment — ${primary?.playerName}`
      : `Record payment for ${invoices.length} invoices`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close record payment dialog"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        className="relative w-full max-w-md bg-card border border-line rounded-(--radius) shadow-card p-5 sm:p-6"
      >
        <h2 id="record-payment-title" className="text-[17px] font-bold text-ink">
          {title}
        </h2>
        {primary && (
          <p className="text-[12.5px] text-muted mt-1">
            {primary.sportBatch} · {primary.period} · {primary.amountLabel}
          </p>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-1">
          <AuthField
            label="Amount (₹)"
            id={id("amount")}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            required
          />

          <InlineFieldGroup>
            <InlineDropdown
              label="Payment method"
              id={id("method")}
              value={method}
              onChange={(value) => setMethod(value as "cash" | "upi" | "bank")}
              options={METHOD_OPTIONS}
              placeholder="Select method"
            />
          </InlineFieldGroup>

          <InlineDatePicker
            label="Payment date"
            layout="stacked"
            value={paidAt}
            onChange={setPaidAt}
            maxDate={todayDateString()}
          />

          {error && <p className="text-[12.5px] text-red">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
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
              {isSubmitting ? "Saving…" : "Record payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
