"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import {
  InlineDropdown,
  InlineFieldGroup,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { CheckIcon } from "@/components/academy/icons";
import { api, ApiError } from "@/lib/api";
import {
  DAY_LABELS,
  minutesFromTimeString,
  minutesToTimeInputValue,
  type DayOfWeek,
  type SlotPayload,
  type TimetableSettings,
  type TimetableSlot,
} from "@/lib/timetable";

type SessionSlotFormProps = {
  academyId: string;
  mode: "create" | "edit";
  slotId?: string;
  initialSlot?: TimetableSlot | null;
  settings: TimetableSettings;
  formOptions: {
    sports: { id: string; name: string }[];
    batches: { id: string; name: string; sportId: string }[];
    coaches: { id: string; fullName: string; sportId: string }[];
  };
  defaultDay?: DayOfWeek;
  onCancel: () => void;
  onSaved: () => void;
};

const DAY_OPTIONS: DropdownOption[] = (Object.entries(DAY_LABELS) as [string, string][]).map(
  ([value, label]) => ({ value, label })
);

export function SessionSlotForm({
  academyId,
  mode,
  slotId,
  initialSlot,
  settings,
  formOptions,
  defaultDay = 1,
  onCancel,
  onSaved,
}: SessionSlotFormProps) {
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [dayOfWeek, setDayOfWeek] = useState(String(defaultDay));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [sportId, setSportId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [venue, setVenue] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sportOptions = useMemo<DropdownOption[]>(
    () => formOptions.sports.map((sport) => ({ value: sport.id, label: sport.name })),
    [formOptions.sports]
  );

  const batchesForSport = useMemo(
    () => formOptions.batches.filter((batch) => batch.sportId === sportId),
    [formOptions.batches, sportId]
  );

  const coachesForSport = useMemo<DropdownOption[]>(
    () =>
      formOptions.coaches
        .filter((coach) => coach.sportId === sportId)
        .map((coach) => ({ value: coach.id, label: coach.fullName })),
    [formOptions.coaches, sportId]
  );

  useEffect(() => {
    if (mode === "edit" && initialSlot) {
      setDayOfWeek(String(initialSlot.dayOfWeek));
      setStartTime(minutesToTimeInputValue(initialSlot.startMinutes));
      setEndTime(minutesToTimeInputValue(initialSlot.endMinutes));
      setSportId(initialSlot.sportId);
      setCoachId(initialSlot.coachId);
      setVenue(initialSlot.venue ?? "");
      setSelectedBatchIds(new Set(initialSlot.batches.map((batch) => batch.id)));
    } else {
      setDayOfWeek(String(defaultDay));
      setStartTime(settings ? minutesToTimeInputValue(settings.openMinutes) : "09:00");
      setEndTime(
        settings
          ? minutesToTimeInputValue(Math.min(settings.openMinutes + 60, settings.closeMinutes))
          : "10:00"
      );
      setSportId(sportOptions[0]?.value ?? "");
      setCoachId("");
      setVenue("");
      setSelectedBatchIds(new Set());
    }
    setError(null);
    setIsSubmitting(false);
  }, [mode, initialSlot, defaultDay, settings, sportOptions]);

  useEffect(() => {
    if (!coachId) return;
    if (!coachesForSport.some((coach) => coach.value === coachId)) {
      setCoachId("");
    }
  }, [coachId, coachesForSport]);

  function toggleBatch(batchId: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  function validateClient(): string | null {
    const startMinutes = minutesFromTimeString(startTime);
    const endMinutes = minutesFromTimeString(endTime);
    if (startMinutes == null || endMinutes == null) return "Enter valid start and end times.";
    if (startMinutes >= endMinutes) return "End time must be after start time.";
    if (settings) {
      if (startMinutes < settings.openMinutes || endMinutes > settings.closeMinutes) {
        return "Session must be within academy operating hours.";
      }
    }
    if (!sportId) return "Sport is required.";
    if (!coachId) return "Coach is required.";
    if (selectedBatchIds.size === 0) return "Select at least one batch.";
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    const startMinutes = minutesFromTimeString(startTime)!;
    const endMinutes = minutesFromTimeString(endTime)!;

    const payload: SlotPayload = {
      dayOfWeek: Number(dayOfWeek) as DayOfWeek,
      startMinutes,
      endMinutes,
      sportId,
      coachId,
      batchIds: [...selectedBatchIds],
      venue: venue.trim() || null,
    };

    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "edit" && slotId) {
        await api.timetable.updateSlot(academyId, slotId, payload);
      } else {
        await api.timetable.createSlot(academyId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save session.");
      setIsSubmitting(false);
    }
  }

  const canSubmit = sportId && coachId && selectedBatchIds.size > 0;

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="border border-line rounded-[11px] p-4 bg-surface/40">
      <h3 className="text-[15px] font-bold text-ink mb-3">
        {mode === "create" ? "Add session" : "Edit session"}
      </h3>

      {error && (
        <p className="text-[13px] font-medium text-red mb-3" role="alert">
          {error}
        </p>
      )}

      <InlineFieldGroup className="mb-4">
        <InlineDropdown
          label="Day"
          id={id("day")}
          value={dayOfWeek}
          onChange={setDayOfWeek}
          options={DAY_OPTIONS}
          placeholder="Select day"
          required
        />

        <div className="flex items-center gap-3 px-[15px] min-h-[48px]">
          <span className="w-[108px] shrink-0 text-[12.5px] font-semibold text-text">Time</span>
          <div className="flex flex-1 items-center gap-2 py-[7px] min-w-0">
            <input
              id={id("start")}
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink font-sans outline-none border border-line rounded-[8px] px-2 py-1"
              required
            />
            <span className="text-muted text-[12px]">to</span>
            <input
              id={id("end")}
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink font-sans outline-none border border-line rounded-[8px] px-2 py-1"
              required
            />
          </div>
        </div>

        <InlineDropdown
          label="Sport"
          id={id("sport")}
          value={sportId}
          onChange={(value) => {
            setSportId(value);
            setSelectedBatchIds(new Set());
            setCoachId("");
          }}
          options={sportOptions}
          placeholder={sportOptions.length === 0 ? "No sports available" : "Select sport"}
          disabled={sportOptions.length === 0}
          required
        />

        <InlineDropdown
          label="Coach"
          id={id("coach")}
          value={coachId}
          onChange={setCoachId}
          options={coachesForSport}
          placeholder={
            !sportId
              ? "Select sport first"
              : coachesForSport.length === 0
                ? "No coaches for this sport"
                : "Select coach"
          }
          disabled={!sportId || coachesForSport.length === 0}
          required
        />

        <div className="flex items-center gap-3 px-[15px] min-h-[48px]">
          <label htmlFor={id("venue")} className="w-[108px] shrink-0 text-[12.5px] font-semibold text-text">
            Venue
          </label>
          <input
            id={id("venue")}
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Optional"
            className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink font-sans outline-none py-1 pl-4"
          />
        </div>
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
          <div className="border border-line rounded-[10px] divide-y divide-line2 max-h-[min(200px,30vh)] overflow-y-auto">
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

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
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
          {isSubmitting ? "Saving…" : mode === "create" ? "Save session" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
