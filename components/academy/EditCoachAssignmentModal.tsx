"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
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

function resolvePrimaryBatchId(
  batches: CoachAssignmentGroup["batches"]
): string {
  return batches.find((batch) => batch.isPrimary)?.id ?? batches[0]?.id ?? "";
}

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
  const initKeyRef = useRef<string | null>(null);

  const [sportId, setSportId] = useState("");
  const [nisLevel, setNisLevel] = useState<NisLevel>("in_review");
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [primaryBatchId, setPrimaryBatchId] = useState("");
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

  const selectedBatches = useMemo(
    () => batchesForSport.filter((batch) => selectedBatchIds.has(batch.id)),
    [batchesForSport, selectedBatchIds]
  );

  useEffect(() => {
    if (!open) {
      initKeyRef.current = null;
      setIsSubmitting(false);
      return;
    }

    const initKey =
      mode === "edit" && initialGroup
        ? `edit:${initialGroup.sportId}`
        : `create:${assignedSportIds.join(",")}`;

    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    setError(null);

    if (mode === "edit" && initialGroup) {
      setSportId(initialGroup.sportId);
      setNisLevel(initialGroup.nisLevel);
      setSelectedBatchIds(new Set(initialGroup.batches.map((batch) => batch.id)));
      setPrimaryBatchId(resolvePrimaryBatchId(initialGroup.batches));
      return;
    }

    const blocked = new Set(assignedSportIds);
    const nextSportId =
      formOptions.sports.find((sport) => !blocked.has(sport.id))?.id ?? "";
    setSportId(nextSportId);
    setNisLevel("in_review");
    setSelectedBatchIds(new Set());
    setPrimaryBatchId("");
  }, [open, mode, initialGroup, assignedSportIds, formOptions.sports]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, isSubmitting]);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  function toggleBatch(batchId: string) {
    const wasChecked = selectedBatchIds.has(batchId);
    const next = new Set(selectedBatchIds);
    if (wasChecked) next.delete(batchId);
    else next.add(batchId);

    setSelectedBatchIds(next);

    if (wasChecked) {
      setPrimaryBatchId((current) => {
        if (current !== batchId) return current;
        return [...next][0] ?? "";
      });
    } else {
      setPrimaryBatchId((current) => current || batchId);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !sportId || selectedBatchIds.size === 0) return;

    const batchIds = [...selectedBatchIds];
    const resolvedPrimaryBatchId =
      primaryBatchId && selectedBatchIds.has(primaryBatchId)
        ? primaryBatchId
        : batchIds[0];

    setError(null);
    setIsSubmitting(true);

    const payload: UpdateCoachAssignmentPayload = {
      sportId,
      nisLevel,
      batchIds,
      primaryBatchId: resolvedPrimaryBatchId,
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
  const allSportsAssigned = mode === "create" && sportOptions.length === 0;

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
            {coachName} · sport, NIS level, batches, and primary batch.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          {allSportsAssigned ? (
            <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3 mb-4">
              This coach is already assigned to every sport. Edit an existing sport row to change
              batches.
            </p>
          ) : (
            <>
              <InlineFieldGroup className="mb-4">
                <InlineDropdown
                  label="Sport"
                  id={id("sport")}
                  value={sportId}
                  onChange={(value) => {
                    setSportId(value);
                    setSelectedBatchIds(new Set());
                    setPrimaryBatchId("");
                  }}
                  options={sportOptions}
                  placeholder={sportOptions.length === 0 ? "No sports available" : "Select sport"}
                  disabled={mode === "edit" || sportOptions.length === 0}
                  menuZIndexClass="z-[60]"
                  required
                />

                <InlineDropdown
                  label="NIS certification"
                  id={id("nis")}
                  value={nisLevel}
                  onChange={(value) => setNisLevel(value as NisLevel)}
                  options={NIS_OPTIONS}
                  placeholder="Select certification"
                  menuZIndexClass="z-[60]"
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
                      const isPrimary = checked && primaryBatchId === batch.id;
                      return (
                        <div
                          key={batch.id}
                          className={`flex items-center gap-3 px-3.5 py-3 transition-colors ${
                            checked ? "bg-brand-soft/40" : "hover:bg-surface/80"
                          }`}
                        >
                          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBatch(batch.id)}
                              className="w-4 h-4 rounded border-line accent-brand shrink-0"
                            />
                            <span className="font-semibold text-[13px] text-ink truncate">
                              {batch.name}
                            </span>
                          </label>
                          {checked && selectedBatchIds.size > 1 ? (
                            <label className="flex items-center gap-1.5 shrink-0 cursor-pointer text-[11.5px] font-medium text-muted">
                              <input
                                type="radio"
                                name={id("primary-batch")}
                                checked={isPrimary}
                                onChange={() => setPrimaryBatchId(batch.id)}
                                className="w-3.5 h-3.5 accent-brand"
                              />
                              Primary
                            </label>
                          ) : checked ? (
                            <span className="text-[11px] font-medium text-muted shrink-0">
                              Primary
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedBatches.length > 0 && (
                <p className="text-[12px] text-muted mb-4">
                  Primary coach for{" "}
                  <span className="font-semibold text-ink">
                    {selectedBatches.find((batch) => batch.id === primaryBatchId)?.name ??
                      selectedBatches[0]?.name}
                  </span>
                  . Other coaches on that batch will be demoted.
                </p>
              )}
            </>
          )}

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
              disabled={!canSubmit || isSubmitting || allSportsAssigned}
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
