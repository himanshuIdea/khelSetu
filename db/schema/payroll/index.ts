import { integer, pgEnum, pgSchema, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const payrollSchema = pgSchema("payroll");

export const payslipStatusEnum = pgEnum("payslip_status", ["paid", "pending"]);

export const payrollRuns = payrollSchema.table("payroll_runs", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const payslips = payrollSchema.table("payslips", {
  id: primaryId(),
  payrollRunId: uuid("payroll_run_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  daysPresent: integer("days_present").notNull(),
  daysExpected: integer("days_expected").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  status: payslipStatusEnum("status").notNull().default("pending"),
  ...timestamps,
});
