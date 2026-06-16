import { boolean, integer, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { academies, batches, sports } from "../academy";
import { coaches, players, staff } from "../people";
import { primaryId, timestamps } from "../_shared";

export const operationsSchema = pgSchema("operations");

export const sessionStatusEnum = pgEnum("session_status", ["upcoming", "marked", "cancelled"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late"]);
export const feeStatusEnum = pgEnum("fee_status", ["paid", "due", "partial"]);
export const staffAttendanceStatusEnum = pgEnum("staff_attendance_status", [
  "present",
  "absent",
  "leave",
]);

export const trainingSessions = operationsSchema.table("training_sessions", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  batchId: uuid("batch_id").references(() => batches.id),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coaches.id),
  sportId: uuid("sport_id").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  venue: text("venue"),
  expectedHeadcount: integer("expected_headcount"),
  status: sessionStatusEnum("status").notNull().default("upcoming"),
  ...timestamps,
});

export const attendanceRecords = operationsSchema.table(
  "attendance_records",
  {
    id: primaryId(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => trainingSessions.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    status: attendanceStatusEnum("status").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attendance_records_session_player_idx").on(table.sessionId, table.playerId),
  ]
);

export const feeInvoices = operationsSchema.table(
  "fee_invoices",
  {
    id: primaryId(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    period: text("period").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    status: feeStatusEnum("status").notNull().default("due"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidThroughPeriod: text("paid_through_period"),
    ...timestamps,
  },
  (table) => [uniqueIndex("fee_invoices_player_period_idx").on(table.playerId, table.period)]
);

export const feePayments = operationsSchema.table("fee_payments", {
  id: primaryId(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => feeInvoices.id),
  amountPaise: integer("amount_paise").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method"),
  ...timestamps,
});

/** Monthly collection targets for dashboard KPIs. */
export const feeTargets = operationsSchema.table(
  "fee_targets",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    period: text("period").notNull(),
    targetPaise: integer("target_paise").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("fee_targets_academy_period_idx").on(table.academyId, table.period)]
);

/** Default fee plans by sport or batch — future billing automation. */
export const feePlanTemplates = operationsSchema.table("fee_plan_templates", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  sportId: uuid("sport_id"),
  batchId: uuid("batch_id").references(() => batches.id),
  label: text("label").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  billingCycleMonths: integer("billing_cycle_months").notNull().default(1),
  ...timestamps,
});

/** Academy operating hours for weekly timetable. */
export const academyScheduleSettings = operationsSchema.table(
  "academy_schedule_settings",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    openMinutes: integer("open_minutes").notNull(),
    closeMinutes: integer("close_minutes").notNull(),
    isConfigured: boolean("is_configured").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("academy_schedule_settings_academy_idx").on(table.academyId)]
);

/** Recurring weekly session slot — one row per time block per day. */
export const weeklyScheduleSlots = operationsSchema.table(
  "weekly_schedule_slots",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinutes: integer("start_minutes").notNull(),
    endMinutes: integer("end_minutes").notNull(),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sports.id),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.id),
    venue: text("venue"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("weekly_schedule_slots_academy_day_start_idx").on(
      table.academyId,
      table.dayOfWeek,
      table.startMinutes,
      table.endMinutes,
      table.sportId,
      table.coachId
    ),
  ]
);

/** Batches assigned to a weekly slot (parallel sessions per batch). */
export const weeklyScheduleSlotBatches = operationsSchema.table(
  "weekly_schedule_slot_batches",
  {
    id: primaryId(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => weeklyScheduleSlots.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    ...timestamps,
  },
  (table) => [uniqueIndex("weekly_schedule_slot_batches_slot_batch_idx").on(table.slotId, table.batchId)]
);

/** Daily staff attendance — source of truth for payroll days_present. */
export const staffAttendance = operationsSchema.table(
  "staff_attendance",
  {
    id: primaryId(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    attendanceDate: timestamp("attendance_date", { withTimezone: true }).notNull(),
    status: staffAttendanceStatusEnum("status").notNull().default("present"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("staff_attendance_staff_date_idx").on(table.staffId, table.attendanceDate),
  ]
);
