"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { CheckIcon } from "@/components/academy/icons";
import { api, ApiError } from "@/lib/api";
import type {
  AssignCoachFormOptions,
  CoachAssignmentGroup,
  NisLevel,
  UpdateCoachAssignmentPayload,
} from "@/lib/coaches";

type EditCoachAssignmentModalProps = {
  academyId: string;
  coachId: string;
  coachName: string;
  open: boolean;
  mode: "create" | "edit";
  initialGroup?: CoachAssignmentGroup | null;
  formOptions: AssignCoachFormOptions;
  assignedSportIds: string[];
  onClose: () => void;
  onSaved: () => void;
};

const NIS_OPTIONS: DropdownOption[] = [
  { value: "in_review", label: "In review" },
  { value: "nis_level_1", label: "NIS Level 1" },
  { value: "nis_level_2", label: "NIS Level 2" },
];

export function EditCoachAssignmentModal({
  academyId,
  coachId,
  coachName,
  open,
  mode,
  initialGroup,
  formOptions,
  assignedSportIds,
  onClose,
  onSaved,
}: EditCoachAssignmentModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [sportId, setSportId] = useState("");
  const [nisLevel, setNisLevel] = useState<NisLevel>("in_review");
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sportOptions = useMemo<DropdownOption[]>(() => {
    const blocked = mode === "create" ? new Set(assignedSportIds) : new Set<string>();
    return formOptions.sports
      .filter((sport) => !blocked.has(sport.id) || sport.id === initialGroup?.sportId)
      .map((sport) => ({ value: sport.id, label: sport.name }));
  }, [formOptions.sports, assignedSportIds, mode, initialGroup?.sportId]);

  const batchesForSport = useMemo(
    () => formOptions.batches.filter((batch) => batch.sportId === sportId),
    [formOptions.batches, sportId]
  );

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
      setIsSubmitting(false);
      return;
    }

    setError(null);
    if (mode === "edit" && initialGroup) {
      setSportId(initialGroup.sportId);
      setNisLevel(initialGroup.nisLevel);
      setSelectedBatchIds(new Set(initialGroup.batches.map((batch) => batch.id)));
    } else {
      setSportId(sportOptions[0]?.value ?? "");
      setNisLevel("in_review");
      setSelectedBatchIds(new Set());
    }
  }, [open, mode, initialGroup, sportOptions]);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  function toggleBatch(batchId: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !sportId || selectedBatchIds.size === 0) return;

    setError(null);
    setIsSubmitting(true);

    const payload: UpdateCoachAssignmentPayload = {
      sportId,
      nisLevel,
      batchIds: [...selectedBatchIds],
    };

    try {
      if (mode === "create") {
        await api.coaches.assign(academyId, {
          coachId,
          ...payload,
        });
      } else {
        await api.coaches.updateAssignment(academyId, coachId, payload);
      }

      onSaved();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  const canSubmit = sportId && selectedBatchIds.size > 0;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close edit assignment modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-coach-assignment-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="px-6 py-6">
          <h2 id="edit-coach-assignment-title" className="text-xl font-bold text-ink tracking-tight">
            {mode === "create" ? "Add assignment" : "Edit assignment"}
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            {coachName} · sport, NIS level, and batches.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          <InlineFieldGroup className="mb-4">
            <InlineDropdown
              label="Sport"
              id={id("sport")}
              value={sportId}
              onChange={(value) => {
                setSportId(value);
                setSelectedBatchIds(new Set());
              }}
              options={sportOptions}
              placeholder={sportOptions.length === 0 ? "No sports available" : "Select sport"}
              disabled={mode === "edit" || sportOptions.length === 0}
              required
            />

            <InlineDropdown
              label="NIS certification"
              id={id("nis")}
              value={nisLevel}
              onChange={(value) => setNisLevel(value as NisLevel)}
              options={NIS_OPTIONS}
              placeholder="Select certification"
            />
          </InlineFieldGroup>

          <div className="mb-4">
            <span className="block text-[12.5px] font-semibold text-text mb-2">Batches</span>
            {!sportId ? (
              <p className="text-[13px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5">
                Select a sport to see batches.
              </p>
            ) : batchesForSport.length === 0 ? (
              <p className="text-[13px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5">
                No batches for this sport yet.
              </p>
            ) : (
              <div className="border border-line rounded-[10px] divide-y divide-line2 max-h-[min(240px,40vh)] overflow-y-auto">
                {batchesForSport.map((batch) => {
                  const checked = selectedBatchIds.has(batch.id);
                  return (
                    <label
                      key={batch.id}
                      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                        checked ? "bg-brand-soft/40" : "hover:bg-surface/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBatch(batch.id)}
                        className="w-4 h-4 rounded border-line accent-brand shrink-0"
                      />
                      <span className="font-semibold text-[13px] text-ink">{batch.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
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
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              {isSubmitting ? "Saving…" : mode === "create" ? "Add assignment" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
