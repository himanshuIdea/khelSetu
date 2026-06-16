import { parseDateOnly } from "@/lib/attendance";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export type ScheduleSettingsPayload = {
  openMinutes: number;
  closeMinutes: number;
};

export type SlotPayload = {
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
  sportId: string;
  coachId: string;
  batchIds: string[];
  venue?: string | null;
};

export type TimetableSlotBatch = {
  id: string;
  name: string;
};

export type TimetableSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
  sportId: string;
  sportName: string;
  coachId: string;
  coachName: string;
  venue: string | null;
  batches: TimetableSlotBatch[];
};

export type TimetableSettings = {
  openMinutes: number;
  closeMinutes: number;
  isConfigured: boolean;
} | null;

export type TimetableData = {
  settings: TimetableSettings;
  slots: TimetableSlot[];
  formOptions: {
    sports: { id: string; name: string }[];
    batches: { id: string; name: string; sportId: string }[];
    coaches: {
      id: string;
      fullName: string;
      sportId: string;
      nisLevel: "nis_level_1" | "nis_level_2" | "in_review";
      staffId: string;
    }[];
  };
};

export type ExpandedSlotRow = {
  slotId: string;
  batchId: string;
  batchName: string;
  sportId: string;
  sportName: string;
  coachId: string;
  coachName: string;
  venue: string | null;
  startMinutes: number;
  endMinutes: number;
  scheduledAt: Date;
};

export function jsDayToIsoWeekday(jsDay: number): DayOfWeek {
  return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

export function isoWeekdayFromDate(date: Date): DayOfWeek {
  return jsDayToIsoWeekday(date.getDay());
}

export function minutesFromTimeString(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatMinutesAsTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  if (mins === 0) {
    return `${displayHour}${period}`;
  }
  return `${displayHour}:${String(mins).padStart(2, "0")}${period}`;
}

export function formatMinutesAsTimeRange(startMinutes: number, endMinutes: number): string {
  return `${formatMinutesAsTime(startMinutes)} – ${formatMinutesAsTime(endMinutes)}`;
}

export function minutesToTimeInputValue(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function scheduledAtFromDateAndMinutes(dateStr: string, startMinutes: number): Date {
  const { start } = parseDateOnly(dateStr);
  const hours = Math.floor(startMinutes / 60);
  const mins = startMinutes % 60;
  start.setHours(hours, mins, 0, 0);
  return start;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function validateScheduleSettings(payload: ScheduleSettingsPayload): string | null {
  if (!Number.isInteger(payload.openMinutes) || payload.openMinutes < 0 || payload.openMinutes > 1439) {
    return "Opening time is invalid.";
  }
  if (!Number.isInteger(payload.closeMinutes) || payload.closeMinutes < 1 || payload.closeMinutes > 1440) {
    return "Closing time is invalid.";
  }
  if (payload.openMinutes >= payload.closeMinutes) {
    return "Closing time must be after opening time.";
  }
  return null;
}

export function validateSlotPayload(payload: SlotPayload): string | null {
  if (!Number.isInteger(payload.dayOfWeek) || payload.dayOfWeek < 1 || payload.dayOfWeek > 7) {
    return "Select a valid day.";
  }
  if (!Number.isInteger(payload.startMinutes) || payload.startMinutes < 0 || payload.startMinutes > 1439) {
    return "Start time is invalid.";
  }
  if (!Number.isInteger(payload.endMinutes) || payload.endMinutes < 1 || payload.endMinutes > 1440) {
    return "End time is invalid.";
  }
  if (payload.startMinutes >= payload.endMinutes) {
    return "End time must be after start time.";
  }
  if (!payload.sportId?.trim()) return "Sport is required.";
  if (!payload.coachId?.trim()) return "Coach is required.";
  if (!Array.isArray(payload.batchIds) || payload.batchIds.length === 0) {
    return "Select at least one batch.";
  }
  return null;
}
