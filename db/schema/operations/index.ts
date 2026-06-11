import { integer, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const operationsSchema = pgSchema("operations");

export const sessionStatusEnum = pgEnum("session_status", ["upcoming", "marked", "cancelled"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late"]);
export const feeStatusEnum = pgEnum("fee_status", ["paid", "due", "partial"]);

export const trainingSessions = operationsSchema.table("training_sessions", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  batchId: uuid("batch_id"),
  coachId: uuid("coach_id").notNull(),
  sportId: uuid("sport_id").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  venue: text("venue"),
  status: sessionStatusEnum("status").notNull().default("upcoming"),
  ...timestamps,
});

export const attendanceRecords = operationsSchema.table(
  "attendance_records",
  {
    id: primaryId(),
    sessionId: uuid("session_id").notNull(),
    playerId: uuid("player_id").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attendance_records_session_player_idx").on(table.sessionId, table.playerId),
  ]
);

export const feeInvoices = operationsSchema.table("fee_invoices", {
  id: primaryId(),
  playerId: uuid("player_id").notNull(),
  academyId: uuid("academy_id").notNull(),
  period: text("period").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  status: feeStatusEnum("status").notNull().default("due"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  ...timestamps,
});

export const feePayments = operationsSchema.table("fee_payments", {
  id: primaryId(),
  invoiceId: uuid("invoice_id").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method"),
  ...timestamps,
});
