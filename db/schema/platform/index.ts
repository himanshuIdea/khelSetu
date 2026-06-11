import { jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId } from "../_shared";

export const platformSchema = pgSchema("platform");

export const activityEvents = platformSchema.table("activity_events", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
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
