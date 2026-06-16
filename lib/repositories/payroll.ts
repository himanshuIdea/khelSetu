import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  daysExpectedForEmployment,
  getMonthPeriod,
  type ApprovePayslipPayload,
  type CreateStaffPayload,
  type UpdateStaffPayload,
} from "@/lib/payroll";
import { countDaysPresent } from "@/lib/repositories/staff-attendance";
import {
  academySports,
  coaches,
  payslips,
  payrollRuns,
  players,
  sports,
  staff,
} from "@/db/schema";
import { formatPaise, formatPaiseFull, getInitials } from "@/lib/format";
import type { StaffMember } from "./types";

async function getLatestPayrollRun(academyId: string) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.academyId, academyId))
    .orderBy(desc(payrollRuns.periodStart))
    .limit(1);

  return run ?? null;
}

async function getPayrollRunForPeriod(academyId: string, periodStart: Date, periodEnd: Date) {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.academyId, academyId),
        eq(payrollRuns.periodStart, periodStart),
        eq(payrollRuns.periodEnd, periodEnd)
      )
    )
    .limit(1);

  return run ?? null;
}

async function getFirstAcademySportId(academyId: string) {
  const [row] = await db
    .select({ sportId: academySports.sportId, color: sports.color })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId))
    .limit(1);

  if (!row) {
    throw new Error("No sports configured for this academy.");
  }

  return row;
}

async function syncCoachStub(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  academyId: string,
  staffRow: typeof staff.$inferSelect,
  isCoach: boolean
) {
  if (!isCoach) return;

  const sport = await getFirstAcademySportId(academyId);

  const [linkedCoach] = await tx
    .select({ id: coaches.id })
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), eq(coaches.staffId, staffRow.id)))
    .limit(1);

  if (linkedCoach) {
    await tx
      .update(coaches)
      .set({
        fullName: staffRow.fullName,
        roleTitle: staffRow.roleTitle,
        avatarColor: staffRow.avatarColor,
        updatedAt: new Date(),
      })
      .where(eq(coaches.id, linkedCoach.id));
    return;
  }

  const [orphanCoach] = await tx
    .select({ id: coaches.id })
    .from(coaches)
    .where(
      and(
        eq(coaches.academyId, academyId),
        eq(coaches.fullName, staffRow.fullName),
        isNull(coaches.staffId)
      )
    )
    .limit(1);

  if (orphanCoach) {
    await tx
      .update(coaches)
      .set({
        staffId: staffRow.id,
        fullName: staffRow.fullName,
        roleTitle: staffRow.roleTitle,
        avatarColor: staffRow.avatarColor,
        updatedAt: new Date(),
      })
      .where(eq(coaches.id, orphanCoach.id));
    return;
  }

  await tx.insert(coaches).values({
    academyId,
    staffId: staffRow.id,
    fullName: staffRow.fullName,
    roleTitle: staffRow.roleTitle,
    sportId: sport.sportId,
    nisLevel: "in_review",
    avatarColor: staffRow.avatarColor,
  });
}

export async function getPayrollStats(academyId: string) {
  const run = await getLatestPayrollRun(academyId);

  const [staffCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(staff)
    .where(eq(staff.academyId, academyId));

  let payrollTotal = 0;
  let pending = 0;
  let coachCount = 0;

  if (run) {
    const [totals] = await db
      .select({
        total: sql<number>`coalesce(sum(${payslips.amountPaise}), 0)`,
        pending: sql<number>`count(*) filter (where ${payslips.status} = 'pending')`,
      })
      .from(payslips)
      .where(eq(payslips.payrollRunId, run.id));

    payrollTotal = Number(totals?.total ?? 0);
    pending = Number(totals?.pending ?? 0);
  }

  const [coachRows] = await db
    .select({ count: sql<number>`count(*)` })
    .from(coaches)
    .where(eq(coaches.academyId, academyId));

  coachCount = Number(coachRows?.count ?? 0);

  return [
    {
      value: String(staffCount?.count ?? 0),
      label: "Total staff",
      iconBg: "var(--brand-soft)",
      iconColor: "var(--brand-d)",
      icon: "users" as const,
    },
    {
      value: formatPaise(payrollTotal),
      label: "Payroll · this month",
      iconBg: "var(--green-soft)",
      iconColor: "#0E9B72",
      icon: "cash" as const,
    },
    {
      value: String(coachCount),
      label: "Coaches",
      iconBg: "var(--blue-soft)",
      iconColor: "#2756D8",
      icon: "cap" as const,
    },
    {
      value: String(pending),
      label: "Pending approval",
      iconBg: "var(--amber-soft)",
      iconColor: "#C77F12",
      icon: "clock" as const,
    },
  ];
}

export async function getStaffMembers(academyId: string): Promise<StaffMember[]> {
  const run = await getLatestPayrollRun(academyId);

  const rows = await db
    .select({
      person: staff,
      payslip: payslips,
      coachId: coaches.id,
    })
    .from(staff)
    .leftJoin(
      payslips,
      run ? and(eq(payslips.payrollRunId, run.id), eq(payslips.staffId, staff.id)) : sql`false`
    )
    .leftJoin(coaches, and(eq(coaches.staffId, staff.id), eq(coaches.academyId, academyId)))
    .where(eq(staff.academyId, academyId))
    .orderBy(staff.fullName);

  return rows.map((row) => {
    const isPending = row.payslip?.status === "pending";
    return {
      id: row.person.id,
      staffId: row.person.id,
      payslipId: row.payslip?.id ?? null,
      isCoach: row.coachId != null,
      initials: getInitials(row.person.fullName),
      name: row.person.fullName,
      role: row.person.roleTitle,
      type: row.person.employmentType === "full_time" ? "Full-time" : "Part-time",
      employmentType: row.person.employmentType,
      daysPresent: row.payslip
        ? `${row.payslip.daysPresent} / ${row.payslip.daysExpected}`
        : "—",
      salary: formatPaiseFull(row.payslip?.amountPaise ?? row.person.monthlySalaryPaise),
      monthlySalaryPaise: row.person.monthlySalaryPaise,
      status: row.payslip
        ? row.payslip.status === "pending"
          ? "Pending"
          : "Paid"
        : "No payslip",
      statusVariant: row.payslip
        ? row.payslip.status === "pending"
          ? "amber"
          : "green"
        : "grey",
      action: isPending ? "Approve" : row.payslip ? "Payslip" : "—",
      avatarColor: row.person.avatarColor,
      canApprove: isPending,
    };
  });
}

export async function createStaffMember(academyId: string, payload: CreateStaffPayload) {
  const sport = await getFirstAcademySportId(academyId);

  return db.transaction(async (tx) => {
    const [staffRow] = await tx
      .insert(staff)
      .values({
        academyId,
        fullName: payload.fullName.trim(),
        roleTitle: payload.roleTitle.trim(),
        employmentType: payload.employmentType,
        monthlySalaryPaise: payload.monthlySalaryPaise,
        avatarColor: sport.color,
      })
      .returning();

    await syncCoachStub(tx, academyId, staffRow, payload.isCoach);

    return { id: staffRow.id };
  });
}

export async function updateStaffMember(
  academyId: string,
  staffId: string,
  payload: UpdateStaffPayload
) {
  const [existing] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.academyId, academyId)))
    .limit(1);

  if (!existing) {
    throw new Error("Staff member not found.");
  }

  return db.transaction(async (tx) => {
    const [staffRow] = await tx
      .update(staff)
      .set({
        fullName: payload.fullName?.trim() ?? existing.fullName,
        roleTitle: payload.roleTitle?.trim() ?? existing.roleTitle,
        employmentType: payload.employmentType ?? existing.employmentType,
        monthlySalaryPaise: payload.monthlySalaryPaise ?? existing.monthlySalaryPaise,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, staffId))
      .returning();

    if (payload.isCoach === true) {
      await syncCoachStub(tx, academyId, staffRow, true);
    }

    return { id: staffRow.id };
  });
}

export async function deleteStaffMember(academyId: string, staffId: string) {
  const [linkedCoach] = await db
    .select({ id: coaches.id })
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), eq(coaches.staffId, staffId)))
    .limit(1);

  if (linkedCoach) {
    const [assignedPlayer] = await db
      .select({ id: players.id })
      .from(players)
      .where(
        and(eq(players.academyId, academyId), eq(players.primaryCoachId, linkedCoach.id))
      )
      .limit(1);

    if (assignedPlayer) {
      throw new Error(
        "Cannot delete this staff member — they are linked to a coach with assigned players."
      );
    }
  }

  const [existing] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.academyId, academyId)))
    .limit(1);

  if (!existing) {
    throw new Error("Staff member not found.");
  }

  await db.transaction(async (tx) => {
    if (linkedCoach) {
      await tx.delete(coaches).where(eq(coaches.id, linkedCoach.id));
    }
    await tx.delete(staff).where(eq(staff.id, staffId));
  });
}

export async function runPayroll(academyId: string, periodDate = new Date()) {
  const { start, end } = getMonthPeriod(periodDate);

  return db.transaction(async (tx) => {
    let [run] = await tx
      .select()
      .from(payrollRuns)
      .where(
        and(
          eq(payrollRuns.academyId, academyId),
          eq(payrollRuns.periodStart, start),
          eq(payrollRuns.periodEnd, end)
        )
      )
      .limit(1);

    if (!run) {
      [run] = await tx
        .insert(payrollRuns)
        .values({
          academyId,
          periodStart: start,
          periodEnd: end,
        })
        .returning();
    }

    const staffRows = await tx.select().from(staff).where(eq(staff.academyId, academyId));

    let created = 0;
    let updated = 0;

    for (const person of staffRows) {
      const daysPresent = await countDaysPresent(person.id, start, end);
      const daysExpected = daysExpectedForEmployment(person.employmentType);

      const [existingPayslip] = await tx
        .select({ id: payslips.id })
        .from(payslips)
        .where(and(eq(payslips.payrollRunId, run.id), eq(payslips.staffId, person.id)))
        .limit(1);

      if (existingPayslip) {
        await tx
          .update(payslips)
          .set({
            daysPresent,
            daysExpected,
            amountPaise: person.monthlySalaryPaise,
            updatedAt: new Date(),
          })
          .where(eq(payslips.id, existingPayslip.id));
        updated += 1;
      } else {
        await tx.insert(payslips).values({
          payrollRunId: run.id,
          staffId: person.id,
          daysPresent,
          daysExpected,
          amountPaise: person.monthlySalaryPaise,
          status: "pending",
        });
        created += 1;
      }
    }

    return {
      payrollRunId: run.id,
      staffCount: staffRows.length,
      created,
      updated,
    };
  });
}

export async function approvePayslip(
  academyId: string,
  payslipId: string,
  approvedByUserId: string,
  payload: ApprovePayslipPayload
) {
  const run = await getLatestPayrollRun(academyId);
  if (!run) {
    throw new Error("No payroll run found.");
  }

  const [payslip] = await db
    .select({ id: payslips.id, status: payslips.status })
    .from(payslips)
    .where(and(eq(payslips.id, payslipId), eq(payslips.payrollRunId, run.id)))
    .limit(1);

  if (!payslip) {
    throw new Error("Payslip not found.");
  }

  if (payslip.status === "paid") {
    throw new Error("Payslip is already paid.");
  }

  await db
    .update(payslips)
    .set({
      status: "paid",
      approvedByUserId,
      paymentReference: payload.paymentReference?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(payslips.id, payslipId));

  return { id: payslipId };
}

export async function bulkApprovePayslips(
  academyId: string,
  payslipIds: string[],
  approvedByUserId: string,
  paymentReference?: string
) {
  const run = await getLatestPayrollRun(academyId);
  if (!run) {
    throw new Error("No payroll run found.");
  }

  const rows = await db
    .select({ id: payslips.id })
    .from(payslips)
    .where(
      and(
        eq(payslips.payrollRunId, run.id),
        inArray(payslips.id, payslipIds),
        eq(payslips.status, "pending")
      )
    );

  if (rows.length === 0) {
    throw new Error("No pending payslips found for approval.");
  }

  const ids = rows.map((row) => row.id);

  await db
    .update(payslips)
    .set({
      status: "paid",
      approvedByUserId,
      paymentReference: paymentReference?.trim() || null,
      updatedAt: new Date(),
    })
    .where(inArray(payslips.id, ids));

  return { approved: ids.length, ids };
}

export async function getStaffMemberForEdit(academyId: string, staffId: string) {
  const [row] = await db
    .select({
      person: staff,
      coachId: coaches.id,
    })
    .from(staff)
    .leftJoin(coaches, and(eq(coaches.staffId, staff.id), eq(coaches.academyId, academyId)))
    .where(and(eq(staff.id, staffId), eq(staff.academyId, academyId)))
    .limit(1);

  if (!row) {
    throw new Error("Staff member not found.");
  }

  return {
    id: row.person.id,
    fullName: row.person.fullName,
    roleTitle: row.person.roleTitle,
    employmentType: row.person.employmentType,
    monthlySalaryPaise: row.person.monthlySalaryPaise,
    isCoach: row.coachId != null,
  };
}

export { getPayrollRunForPeriod, getLatestPayrollRun };
