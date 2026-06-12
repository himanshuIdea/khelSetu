import { integer, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { academies } from "../academy";
import { coaches, players } from "../people";
import { primaryId, timestamps } from "../_shared";

export const trainingSchema = pgSchema("training");

export const drillSubmissionStatusEnum = pgEnum("drill_submission_status", [
  "pending",
  "reviewed",
]);

export const drillSubmissions = trainingSchema.table("drill_submissions", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coaches.id),
  drillName: text("drill_name").notNull(),
  thumbnailGradient: text("thumbnail_gradient"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  status: drillSubmissionStatusEnum("status").notNull().default("pending"),
  ...timestamps,
});

export const drillReviews = trainingSchema.table(
  "drill_reviews",
  {
    id: primaryId(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => drillSubmissions.id),
    reviewerCoachId: uuid("reviewer_coach_id")
      .notNull()
      .references(() => coaches.id),
    rating: integer("rating"),
    notes: text("notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [uniqueIndex("drill_reviews_submission_idx").on(table.submissionId)]
);
