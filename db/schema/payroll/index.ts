import { integer, pgEnum, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { academies } from "../academy";
import { staff } from "../people";
import { primaryId, timestamps } from "../_shared";

export const payrollSchema = pgSchema("payroll");

export const payslipStatusEnum = pgEnum("payslip_status", ["paid", "pending"]);

export const payrollRuns = payrollSchema.table("payroll_runs", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const payslips = payrollSchema.table("payslips", {
  id: primaryId(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id),
  daysPresent: integer("days_present").notNull(),
  daysExpected: integer("days_expected").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  status: payslipStatusEnum("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  approvedByUserId: uuid("approved_by_user_id"),
  ...timestamps,
});
