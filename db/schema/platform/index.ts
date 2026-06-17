import { jsonb, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { academies } from "../academy";
import { users } from "../identity";
import { primaryId, timestamps } from "../_shared";

export const platformSchema = pgSchema("platform");

export const reportStatusEnum = pgEnum("report_status", ["pending", "ready", "failed"]);

export const nurseryVerificationStatusEnum = pgEnum("nursery_verification_status", [
  "verified",
  "pending",
  "flagged",
]);

export const activityEvents = platformSchema.table("activity_events", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  eventType: text("event_type").notNull(),
  actorName: text("actor_name").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const outboxEvents = platformSchema.table("outbox_events", {
  id: primaryId(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

/** Generated report exports for the Reports page. */
export const reportExports = platformSchema.table("report_exports", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  reportType: text("report_type").notNull(),
  periodLabel: text("period_label").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** State-recognized sports nursery registry (links to academy). */
export const stateNurseryRegistrations = platformSchema.table(
  "state_nursery_registrations",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    verificationStatus: nurseryVerificationStatusEnum("verification_status")
      .notNull()
      .default("verified"),
    registeredByUserId: uuid("registered_by_user_id")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [uniqueIndex("state_nursery_registrations_academy_idx").on(table.academyId)]
);
