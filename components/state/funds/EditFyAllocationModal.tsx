"use client";

import { useEffect, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import { formatPaiseFull } from "@/lib/format";

type EditFyAllocationModalProps = {
  fiscalYearLabel: string;
  fyTotalAllocatedPaise: number;
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function EditFyAllocationModal({
  fiscalYearLabel,
  fyTotalAllocatedPaise,
  open,
  onClose,
  onSaved,
}: EditFyAllocationModalProps) {
  const [rupees, setRupees] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRupees(
        fyTotalAllocatedPaise > 0 ? String(Math.round(fyTotalAllocatedPaise / 100)) : ""
      );
      setError(null);
    }
  }, [open, fyTotalAllocatedPaise]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = Number(rupees.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid allocation amount in rupees.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.state.funds.updateFyAllocation(Math.round(parsed * 100));
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update FY allocation.");
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
        aria-labelledby="edit-fy-allocation-title"
        className="relative w-full max-w-md bg-card border border-line rounded-(--radius) p-5 shadow-xl"
      >
        <h2 id="edit-fy-allocation-title" className="text-lg font-bold text-ink">
          FY total allocation
        </h2>
        <p className="text-[13px] text-muted mt-1">FY {fiscalYearLabel}</p>
        <p className="text-[12px] text-muted2 mt-0.5">
          Current:{" "}
          {fyTotalAllocatedPaise > 0 ? formatPaiseFull(fyTotalAllocatedPaise) : "Not set"}
        </p>
        <p className="text-[12px] text-muted2 mt-1">
          Used for the dashboard &ldquo;% of allocation&rdquo; metric. Scheme-level allocations
          remain separate.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <AuthField
            label="Total FY allocation (₹)"
            type="number"
            min={0}
            step={1}
            value={rupees}
            onChange={(event) => setRupees(event.target.value)}
            placeholder="e.g. 471000000"
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
              {saving ? "Saving…" : "Save allocation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
