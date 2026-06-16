"use client";

import { FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionSlotForm } from "@/components/academy/SessionSlotForm";
import { SimpleConfirmDialog } from "@/components/academy/UnassignConfirmDialog";
import { Pill } from "@/components/academy/shared";
import { CalendarIcon, PlusIcon } from "@/components/academy/icons";
import { InlineFieldGroup } from "@/components/academy/InlineFormFields";
import { api, ApiError } from "@/lib/api";
import {
  DAY_SHORT_LABELS,
  formatMinutesAsTimeRange,
  jsDayToIsoWeekday,
  minutesFromTimeString,
  minutesToTimeInputValue,
  type DayOfWeek,
  type TimetableData,
  type TimetableSlot,
} from "@/lib/timetable";

type SessionTimetableModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
};

export function SessionTimetableModal({ academyId, open, onClose }: SessionTimetableModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const openId = `${fieldIds}-open`;
  const closeId = `${fieldIds}-close`;

  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(jsDayToIsoWeekday(new Date().getDay()));
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [slotFormMode, setSlotFormMode] = useState<"create" | "edit">("create");
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTimetable = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.timetable.get(academyId);
      setTimetable(data);
      if (data.settings) {
        setOpenTime(minutesToTimeInputValue(data.settings.openMinutes));
        setCloseTime(minutesToTimeInputValue(data.settings.closeMinutes));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load timetable.");
      setTimetable(null);
    } finally {
      setIsLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !isSavingSettings &&
        !isDeleting &&
        !slotFormOpen &&
        !deleteTarget
      ) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    void loadTimetable();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loadTimetable, onClose, isSavingSettings, isDeleting, slotFormOpen, deleteTarget]);

  useEffect(() => {
    if (!open) {
      setSlotFormOpen(false);
      setEditingSlot(null);
      setDeleteTarget(null);
      setIsSavingSettings(false);
      setIsDeleting(false);
    }
  }, [open]);

  const settingsConfigured = Boolean(timetable?.settings?.isConfigured);

  const slotsForDay = useMemo(
    () =>
      (timetable?.slots ?? [])
        .filter((slot) => slot.dayOfWeek === selectedDay)
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [timetable?.slots, selectedDay]
  );

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    if (isSavingSettings) return;

    const openMinutes = minutesFromTimeString(openTime);
    const closeMinutes = minutesFromTimeString(closeTime);
    if (openMinutes == null || closeMinutes == null) {
      setError("Enter valid opening and closing times.");
      return;
    }
    if (openMinutes >= closeMinutes) {
      setError("Closing time must be after opening time.");
      return;
    }

    setError(null);
    setIsSavingSettings(true);

    try {
      const data = await api.timetable.saveSettings(academyId, { openMinutes, closeMinutes });
      setTimetable(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save academy hours.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  function openCreateSlot() {
    setSlotFormMode("create");
    setEditingSlot(null);
    setSlotFormOpen(true);
  }

  function openEditSlot(slot: TimetableSlot) {
    setSlotFormMode("edit");
    setEditingSlot(slot);
    setSlotFormOpen(true);
  }

  async function handleSlotSaved() {
    setSlotFormOpen(false);
    setEditingSlot(null);
    await loadTimetable();
    router.refresh();
  }

  async function handleDeleteSlot() {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await api.timetable.deleteSlot(academyId, deleteTarget.id);
      setDeleteTarget(null);
      await loadTimetable();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete session.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-ink/50"
          aria-label="Close session timetable modal"
          onClick={isSavingSettings || isDeleting || slotFormOpen ? undefined : onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-timetable-title"
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
        >
          <div className="px-6 py-6">
            <div className="flex gap-[13px] items-start mb-5">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-soft)", color: "var(--brand-d)" }}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 id="session-timetable-title" className="text-xl font-bold text-ink tracking-tight">
                  Weekly timetable
                </h2>
                <p className="text-[13px] text-muted mt-1">
                  Set academy hours and schedule recurring sessions by day, sport, and batch.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-[13px] font-medium text-red mb-4" role="alert">
                {error}
              </p>
            )}

            <section className="mb-5">
              <h3 className="text-[13px] font-bold text-ink mb-2">Academy timings</h3>
              <form onSubmit={(event) => void handleSaveSettings(event)}>
                <InlineFieldGroup className="mb-3">
                  <div className="flex items-center gap-3 px-[15px] min-h-[48px]">
                    <label htmlFor={openId} className="w-[108px] shrink-0 text-[12.5px] font-semibold text-text">
                      Open
                    </label>
                    <input
                      id={openId}
                      type="time"
                      value={openTime}
                      onChange={(event) => setOpenTime(event.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink font-sans outline-none py-1 pl-4"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3 px-[15px] min-h-[48px]">
                    <label htmlFor={closeId} className="w-[108px] shrink-0 text-[12.5px] font-semibold text-text">
                      Close
                    </label>
                    <input
                      id={closeId}
                      type="time"
                      value={closeTime}
                      onChange={(event) => setCloseTime(event.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink font-sans outline-none py-1 pl-4"
                      required
                    />
                  </div>
                </InlineFieldGroup>
                <button
                  type="submit"
                  disabled={isSavingSettings || isLoading}
                  className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
                >
                  {isSavingSettings ? "Saving…" : "Set timetable"}
                </button>
              </form>
            </section>

            <section className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-[13px] font-bold text-ink">Sessions</h3>
                <button
                  type="button"
                  onClick={openCreateSlot}
                  disabled={!settingsConfigured || isLoading || slotFormOpen}
                  className="inline-flex items-center gap-1.5 bg-card text-text font-semibold text-[12.5px] py-2 px-3 rounded-[9px] border border-line disabled:opacity-50"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add session
                </button>
              </div>

              {!settingsConfigured && (
                <p className="text-[13px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5 mb-3">
                  Set academy operating hours first, then add sessions.
                </p>
              )}

              {slotFormOpen && timetable && (
                <div className="mb-4">
                  <SessionSlotForm
                    academyId={academyId}
                    mode={slotFormMode}
                    slotId={editingSlot?.id}
                    initialSlot={editingSlot}
                    settings={timetable.settings}
                    formOptions={timetable.formOptions}
                    defaultDay={selectedDay}
                    onCancel={() => {
                      setSlotFormOpen(false);
                      setEditingSlot(null);
                    }}
                    onSaved={() => void handleSlotSaved()}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(Object.entries(DAY_SHORT_LABELS) as [string, string][]).map(([value, label]) => {
                  const day = Number(value) as DayOfWeek;
                  const active = selectedDay === day;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-colors ${
                        active
                          ? "bg-brand text-white border-brand"
                          : "bg-card text-muted border-line hover:border-brand/40"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <p className="text-[13px] text-muted py-4">Loading sessions…</p>
              ) : slotsForDay.length === 0 ? (
                <p className="text-[13px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5">
                  No sessions on {DAY_SHORT_LABELS[selectedDay]} yet.
                </p>
              ) : (
                <div className="border border-line rounded-[10px] divide-y divide-line2">
                  {slotsForDay.map((slot) => (
                    <div key={slot.id} className="px-4 py-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-[13.5px] text-ink">
                            {formatMinutesAsTimeRange(slot.startMinutes, slot.endMinutes)}
                          </div>
                          <div className="text-[13px] text-ink mt-0.5">
                            {slot.sportName} · Coach {slot.coachName}
                          </div>
                          {slot.venue ? (
                            <div className="text-[12px] text-muted mt-0.5">{slot.venue}</div>
                          ) : null}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {slot.batches.map((batch) => (
                              <Pill key={batch.id} variant="grey">
                                {batch.name}
                              </Pill>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditSlot(slot)}
                            disabled={slotFormOpen}
                            className="text-[12px] font-semibold text-brand py-1.5 px-2.5 rounded-[8px] border border-line disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(slot)}
                            disabled={isDeleting}
                            className="text-[12px] font-semibold text-red py-1.5 px-2.5 rounded-[8px] border border-line disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSavingSettings || isDeleting}
                className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <SimpleConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete session?"
        description={
          deleteTarget
            ? `Remove ${formatMinutesAsTimeRange(deleteTarget.startMinutes, deleteTarget.endMinutes)} · ${deleteTarget.sportName} from ${DAY_SHORT_LABELS[deleteTarget.dayOfWeek]}?`
            : ""
        }
        isSubmitting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteSlot()}
      />
    </>
  );
}
