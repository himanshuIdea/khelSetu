export type StaffAttendanceStatus = "present" | "absent" | "leave";

export type StaffAttendanceRosterEntry = {
  staffId: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  status: StaffAttendanceStatus | null;
  recordId: string | null;
};

export type StaffAttendanceSession = {
  date: string;
  roster: StaffAttendanceRosterEntry[];
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  markedCount: number;
  totalStaff: number;
  isMarked: boolean;
};

export type SaveStaffAttendancePayload = {
  date: string;
  records: { staffId: string; status: StaffAttendanceStatus }[];
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateSaveStaffAttendancePayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }

  const payload = body as Partial<SaveStaffAttendancePayload>;
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
    if (!record.staffId || typeof record.staffId !== "string") {
      return "Each record must include a staff member.";
    }
    if (record.status !== "present" && record.status !== "absent" && record.status !== "leave") {
      return "Status must be present, absent, or leave.";
    }
  }

  return null;
}
