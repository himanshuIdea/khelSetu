import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { parseDateOnly } from "@/lib/attendance";
import type {
  SaveStaffAttendancePayload,
  StaffAttendanceSession,
  StaffAttendanceStatus,
} from "@/lib/staff-attendance";
import { staff, staffAttendance } from "@/db/schema";
import { getInitials } from "@/lib/format";

export async function getStaffRosterForDate(
  academyId: string,
  dateStr: string
): Promise<StaffAttendanceSession> {
  const { start, end } = parseDateOnly(dateStr);

  const staffRows = await db
    .select()
    .from(staff)
    .where(eq(staff.academyId, academyId))
    .orderBy(staff.fullName);

  const staffIds = staffRows.map((row) => row.id);
  const attendanceRows =
    staffIds.length > 0
      ? await db
          .select()
          .from(staffAttendance)
          .where(
            and(
              eq(staffAttendance.academyId, academyId),
              gte(staffAttendance.attendanceDate, start),
              lte(staffAttendance.attendanceDate, end)
            )
          )
      : [];

  const byStaffId = new Map(attendanceRows.map((row) => [row.staffId, row]));

  const roster = staffRows.map((person) => {
    const record = byStaffId.get(person.id);
    return {
      staffId: person.id,
      name: person.fullName,
      initials: getInitials(person.fullName),
      avatarColor: person.avatarColor,
      role: person.roleTitle,
      status: (record?.status as StaffAttendanceStatus | undefined) ?? null,
      recordId: record?.id ?? null,
    };
  });

  const presentCount = roster.filter((entry) => entry.status === "present").length;
  const absentCount = roster.filter((entry) => entry.status === "absent").length;
  const leaveCount = roster.filter((entry) => entry.status === "leave").length;
  const markedCount = roster.filter((entry) => entry.status != null).length;

  return {
    date: dateStr,
    roster,
    presentCount,
    absentCount,
    leaveCount,
    markedCount,
    totalStaff: roster.length,
    isMarked: markedCount > 0,
  };
}

export async function saveStaffAttendance(
  academyId: string,
  payload: SaveStaffAttendancePayload
) {
  const { start, end } = parseDateOnly(payload.date);

  return db.transaction(async (tx) => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    for (const record of payload.records) {
      const [person] = await tx
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.id, record.staffId), eq(staff.academyId, academyId)))
        .limit(1);

      if (!person) {
        throw new Error("Staff member not found.");
      }

      const [existing] = await tx
        .select({ id: staffAttendance.id })
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.staffId, record.staffId),
            gte(staffAttendance.attendanceDate, start),
            lte(staffAttendance.attendanceDate, end)
          )
        )
        .limit(1);

      if (existing) {
        await tx
          .update(staffAttendance)
          .set({ status: record.status, updatedAt: new Date() })
          .where(eq(staffAttendance.id, existing.id));
      } else {
        await tx.insert(staffAttendance).values({
          academyId,
          staffId: record.staffId,
          attendanceDate: start,
          status: record.status,
        });
      }

      if (record.status === "present") present += 1;
      else if (record.status === "absent") absent += 1;
      else leave += 1;
    }

    return {
      present,
      absent,
      leave,
      total: payload.records.length,
    };
  });
}

export async function countDaysPresent(
  staffId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(staffAttendance)
    .where(
      and(
        eq(staffAttendance.staffId, staffId),
        eq(staffAttendance.status, "present"),
        gte(staffAttendance.attendanceDate, periodStart),
        lte(staffAttendance.attendanceDate, periodEnd)
      )
    );

  return Number(row?.count ?? 0);
}
