"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditCoachAssignmentModal } from "@/components/academy/EditCoachAssignmentModal";
import {
  SimpleConfirmDialog,
  UnassignConfirmDialog,
  type UnassignConfirmState,
} from "@/components/academy/UnassignConfirmDialog";
import { Pill } from "@/components/academy/shared";
import { api, ApiError } from "@/lib/api";
import type {
  AssignCoachFormOptions,
  CoachAssignmentGroup,
  UnassignPayload,
} from "@/lib/coaches";
import { nisLevelLabel } from "@/lib/format";
import type { Coach } from "@/lib/repositories/types";

type CoachAssignmentsModalProps = {
  academyId: string;
  coach: Coach | null;
  open: boolean;
  formOptions: AssignCoachFormOptions;
  onClose: () => void;
};

type PendingUnassign = {
  payload: UnassignPayload;
  title: string;
  description: string;
};

export function CoachAssignmentsModal({
  academyId,
  coach,
  open,
  formOptions,
  onClose,
}: CoachAssignmentsModalProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<CoachAssignmentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editGroup, setEditGroup] = useState<CoachAssignmentGroup | null>(null);
  const [confirmState, setConfirmState] = useState<UnassignConfirmState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [simpleConfirm, setSimpleConfirm] = useState<PendingUnassign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!coach) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.coaches.listAssignments(academyId, coach.id);
      setAssignments(result.assignments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load assignments.");
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [academyId, coach]);

  useEffect(() => {
    if (!open || !coach) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting && !editOpen && !confirmOpen && !simpleConfirm) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    void loadAssignments();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, coach, loadAssignments, onClose, isSubmitting, editOpen, confirmOpen, simpleConfirm]);

  useEffect(() => {
    if (!open) {
      setEditOpen(false);
      setConfirmOpen(false);
      setSimpleConfirm(null);
      setConfirmState(null);
      setIsSubmitting(false);
    }
  }, [open]);

  async function beginUnassign(pending: PendingUnassign) {
    if (!coach) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const preview = await api.coaches.previewUnassign(academyId, coach.id, pending.payload);

      if (preview.players.length > 0) {
        setConfirmState({
          title: pending.title,
          description: pending.description,
          payload: pending.payload,
          players: preview.players,
          promotions: preview.promotions,
        });
        setConfirmOpen(true);
      } else {
        setSimpleConfirm(pending);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not preview changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function executeUnassign(payload: UnassignPayload) {
    if (!coach) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.coaches.unassign(academyId, coach.id, payload);
      setConfirmOpen(false);
      setSimpleConfirm(null);
      setConfirmState(null);
      await loadAssignments();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove assignment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreate() {
    setEditMode("create");
    setEditGroup(null);
    setEditOpen(true);
  }

  function openEdit(group: CoachAssignmentGroup) {
    setEditMode("edit");
    setEditGroup(group);
    setEditOpen(true);
  }

  if (!open || !coach) return null;

  const assignedSportIds = assignments.map((group) => group.sportId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-ink/50"
          aria-label="Close coach assignments modal"
          onClick={isSubmitting ? undefined : onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coach-assignments-title"
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
        >
          <div className="px-6 py-6">
            <div className="flex gap-[13px] items-start mb-5">
              <div
                className="w-12 h-12 rounded-[13px] flex items-center justify-center font-bold text-base text-white shrink-0"
                style={{ backgroundColor: coach.avatarColor }}
              >
                {coach.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="coach-assignments-title" className="text-xl font-bold text-ink tracking-tight">
                  {coach.name}
                </h2>
                <p className="text-[13px] text-muted mt-0.5">{coach.role}</p>
                <p className="text-[12px] text-muted mt-1">
                  {coach.players} players · {coach.toReview} to review
                </p>
              </div>
            </div>

            {error && (
              <p className="text-[13px] font-medium text-red mb-4" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-[13px] font-semibold text-ink">Assignments by sport</h3>
              <button
                type="button"
                onClick={openCreate}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[9px] px-3.5 rounded-[10px] disabled:opacity-50"
              >
                Add assignment
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="h-24 bg-surface rounded-[10px] border border-line" />
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3.5">
                No batch assignments yet. Add a sport and batches for this coach.
              </p>
            ) : (
              <div className="space-y-3">
                {assignments.map((group) => {
                  const nis = nisLevelLabel(group.nisLevel);
                  return (
                    <div
                      key={group.sportId}
                      className="border border-line rounded-[10px] px-4 py-3.5 bg-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-[14px] text-ink">{group.sportName}</div>
                          <div className="mt-1.5">
                            <Pill variant={group.nisLevel === "in_review" ? "grey" : "blue"}>
                              {nis.label}
                            </Pill>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {group.batches.map((batch) => (
                              <span
                                key={batch.id}
                                className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-1 rounded-full bg-surface border border-line2 text-ink"
                              >
                                {batch.name}
                                {batch.isPrimary && (
                                  <span className="text-[10px] text-muted">· primary</span>
                                )}
                                <button
                                  type="button"
                                  aria-label={`Remove ${batch.name}`}
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    void beginUnassign({
                                      payload: {
                                        scope: "batch",
                                        batchId: batch.id,
                                      },
                                      title: `Remove from ${batch.name}?`,
                                      description: `This will remove ${coach.name} from ${batch.name}. Players with this coach as primary in this batch will be unassigned.`,
                                    })
                                  }
                                  className="ml-0.5 text-muted hover:text-red disabled:opacity-40"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(group)}
                            disabled={isSubmitting}
                            className="text-[12.5px] font-semibold text-brand hover:text-brand-d disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              void beginUnassign({
                                payload: { scope: "sport", sportId: group.sportId },
                                title: `Remove ${group.sportName} assignment?`,
                                description: `This removes all ${group.sportName} batches for ${coach.name}. All players with this coach as primary will be unassigned.`,
                              })
                            }
                            className="text-[12.5px] font-semibold text-red hover:opacity-80 disabled:opacity-50"
                          >
                            Delete sport
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 pt-4 border-t border-line2">
              <button
                type="button"
                disabled={isSubmitting || assignments.length === 0}
                onClick={() =>
                  void beginUnassign({
                    payload: { scope: "all" },
                    title: "Remove from all batches?",
                    description: `This removes every batch assignment for ${coach.name}. All players with this coach as primary will be unassigned.`,
                  })
                }
                className="inline-flex items-center justify-center text-red font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-red/30 hover:bg-red/5 disabled:opacity-50"
              >
                Remove from all batches
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditCoachAssignmentModal
        academyId={academyId}
        coachId={coach.id}
        coachName={coach.name}
        open={editOpen}
        mode={editMode}
        initialGroup={editGroup}
        formOptions={formOptions}
        assignedSportIds={assignedSportIds}
        onClose={() => setEditOpen(false)}
        onSaved={() => void loadAssignments()}
      />

      <UnassignConfirmDialog
        open={confirmOpen}
        state={confirmState}
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (isSubmitting) return;
          setConfirmOpen(false);
          setConfirmState(null);
        }}
        onConfirm={() => {
          if (!confirmState) return;
          void executeUnassign(confirmState.payload);
        }}
      />

      <SimpleConfirmDialog
        open={Boolean(simpleConfirm)}
        title={simpleConfirm?.title ?? ""}
        description={simpleConfirm?.description ?? ""}
        isSubmitting={isSubmitting}
        onCancel={() => setSimpleConfirm(null)}
        onConfirm={() => {
          if (!simpleConfirm) return;
          void executeUnassign(simpleConfirm.payload);
        }}
      />
    </>
  );
}
