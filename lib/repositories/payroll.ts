import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { payslips, payrollRuns, staff } from "@/db/schema";
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

  const [coachesOnStaff] = await db
    .select({ count: sql<number>`count(*)` })
    .from(staff)
    .where(sql`${staff.academyId} = ${academyId} and ${staff.roleTitle} ilike '%coach%'`);

  coachCount = Number(coachesOnStaff?.count ?? 0);

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
    })
    .from(staff)
    .leftJoin(
      payslips,
      run ? and(eq(payslips.payrollRunId, run.id), eq(payslips.staffId, staff.id)) : sql`false`
    )
    .where(eq(staff.academyId, academyId));

  return rows.map((row) => ({
    initials: getInitials(row.person.fullName),
    name: row.person.fullName,
    role: row.person.roleTitle,
    type: row.person.employmentType === "full_time" ? "Full-time" : "Part-time",
    daysPresent: row.payslip
      ? `${row.payslip.daysPresent} / ${row.payslip.daysExpected}`
      : "—",
    salary: formatPaiseFull(row.payslip?.amountPaise ?? row.person.monthlySalaryPaise),
    status: row.payslip?.status === "pending" ? "Pending" : "Paid",
    statusVariant: row.payslip?.status === "pending" ? "amber" : "green",
    action: row.payslip?.status === "pending" ? "Review" : "Payslip",
    avatarColor: row.person.avatarColor,
  }));
}
