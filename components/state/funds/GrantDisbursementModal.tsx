"use client";

import { useEffect, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { api, ApiError } from "@/lib/api";
import { formatPaiseFull } from "@/lib/format";

type GrantDisbursementModalProps = {
  open: boolean;
  onClose: () => void;
  schemeSlug: string;
  beneficiaryId: string;
  beneficiaryName: string;
  onGranted: () => void | Promise<void>;
};

const STATUS_OPTIONS = [
  { value: "paid", label: "Paid (DBT released)" },
  { value: "pending", label: "Pending approval" },
];

export function GrantDisbursementModal({
  open,
  onClose,
  schemeSlug,
  beneficiaryId,
  beneficiaryName,
  onGranted,
}: GrantDisbursementModalProps) {
  const [amountRupees, setAmountRupees] = useState("");
  const [status, setStatus] = useState("paid");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountRupees("");
    setStatus("paid");
    setDueDate("");
    setNote("");
    setError(null);
  }, [open, beneficiaryId]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(amountRupees.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid grant amount in rupees.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.state.funds.createDisbursement(schemeSlug, {
        beneficiaryId,
        amountPaise: Math.round(parsed * 100),
        status: status as "paid" | "pending",
        dueDate: dueDate || null,
        referenceNote: note.trim() || undefined,
      });
      await onGranted();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create grant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-card border border-line rounded-(--radius) p-5 shadow-xl"
      >
        <h2 className="text-lg font-bold text-ink">Create grant</h2>
        <p className="text-[13px] text-muted mt-1">{beneficiaryName}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <AuthField
            label="Grant amount (₹)"
            type="number"
            min={1}
            step={1}
            value={amountRupees}
            onChange={(event) => setAmountRupees(event.target.value)}
            placeholder="Enter amount in rupees"
          />

          <div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Status</label>
            <InlineSelect
              value={status}
              options={STATUS_OPTIONS}
              onChange={setStatus}
              placeholder="Select status"
            />
          </div>

          <AuthField
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />

          <AuthField
            label="Reference note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="DBT reference or remarks"
          />

          {error && (
            <p className="text-[13px] text-[#D63B3B]" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold text-muted border border-line rounded-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-[13px] font-semibold text-white bg-brand rounded-[10px] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save grant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GrantStatusPill({
  status,
  amountPaise,
}: {
  status: "none" | "pending" | "paid";
  amountPaise: number;
}) {
  if (status === "none") {
    return (
      <span className="text-[11.5px] text-muted2 font-medium">Not granted</span>
    );
  }

  const label = formatPaiseFull(amountPaise);
  if (status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FFF4E0] text-[#C77F12] px-2.5 py-1 text-[11px] font-semibold">
        Pending {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-green-soft text-[#0E9B72] px-2.5 py-1 text-[11px] font-semibold">
      Paid {label}
    </span>
  );
}
