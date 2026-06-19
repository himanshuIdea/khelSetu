"use client";

import { useEffect, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import { formatPaiseFull } from "@/lib/format";
import type { StateFundScheme } from "@/lib/state-portal";

type EditAllocationModalProps = {
  scheme: StateFundScheme | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function EditAllocationModal({ scheme, open, onClose, onSaved }: EditAllocationModalProps) {
  const [rupees, setRupees] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scheme) {
      setRupees(String(Math.round(scheme.allocatedPaise / 100)));
      setError(null);
    }
  }, [scheme]);

  if (!open || !scheme) return null;

  const displayDefault = rupees;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!scheme) return;

    const parsed = Number(displayDefault.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid allocation amount in rupees.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.state.funds.updateAllocation(scheme.slug, Math.round(parsed * 100));
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update allocation.");
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
        aria-labelledby="edit-allocation-title"
        className="relative w-full max-w-md bg-card border border-line rounded-(--radius) p-5 shadow-xl"
      >
        <h2 id="edit-allocation-title" className="text-lg font-bold text-ink">
          Edit allocation
        </h2>
        <p className="text-[13px] text-muted mt-1">{scheme.name}</p>
        <p className="text-[12px] text-muted2 mt-0.5">
          Current: {formatPaiseFull(scheme.allocatedPaise)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <AuthField
            label="FY allocation (₹)"
            type="number"
            min={0}
            step={1}
            value={displayDefault}
            onChange={(event) => setRupees(event.target.value)}
            placeholder="e.g. 142000000"
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
