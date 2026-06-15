export type AttendanceMarkStatus = "present" | "absent";

export type AttendanceFormOptions = {
  sports: { id: string; name: string }[];
  batches: { id: string; name: string; sportId: string }[];
};

export type AttendanceRosterEntry = {
  playerId: string;
  name: string;
  initials: string;
  avatarColor: string;
  status: AttendanceMarkStatus | null;
  recordId: string | null;
};

export type AttendanceMarkSession = {
  sessionId: string | null;
  batchId: string;
  date: string;
  roster: AttendanceRosterEntry[];
  presentCount: number;
  absentCount: number;
  markedCount: number;
  totalPlayers: number;
  isMarked: boolean;
};

export type BatchAttendanceHistoryEntry = {
  sessionId: string;
  date: string;
  dateLabel: string;
  present: number;
  absent: number;
  total: number;
  rate: string;
  status: "marked" | "upcoming" | "cancelled";
};

export type SaveAttendancePayload = {
  batchId: string;
  date: string;
  records: { playerId: string; status: AttendanceMarkStatus }[];
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return {
    start: new Date(year, month - 1, day),
    end: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

export function scheduledAtForDate(dateStr: string): Date {
  const { start } = parseDateOnly(dateStr);
  start.setHours(9, 0, 0, 0);
  return start;
}

export function validateSaveAttendancePayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<SaveAttendancePayload>;
  if (!payload.batchId || typeof payload.batchId !== "string") {
    return "Batch is required.";
  }
  if (!payload.date || typeof payload.date !== "string" || !ISO_DATE_RE.test(payload.date)) {
    return "A valid date (YYYY-MM-DD) is required.";
  }
  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    return "At least one attendance record is required.";
  }

  for (const record of payload.records) {
    if (!record || typeof record !== "object") {
      return "Invalid attendance record.";
    }
    if (!record.playerId || typeof record.playerId !== "string") {
      return "Each record must include a player.";
    }
    if (record.status !== "present" && record.status !== "absent") {
      return "Attendance status must be present or absent.";
    }
  }

  return null;
}
