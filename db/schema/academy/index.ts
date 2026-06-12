import { boolean, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, softDelete, timestamps } from "../_shared";

export const academySchema = pgSchema("academy");

export const fundingTypeEnum = pgEnum("funding_type", ["govt_aided", "private"]);

export const academies = academySchema.table(
  "academies",
  {
    id: primaryId(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    state: text("state").notNull().default("Haryana"),
    fundingType: fundingTypeEnum("funding_type").notNull().default("govt_aided"),
    brandColor: text("brand_color").notNull().default("#FF6B2C"),
    initials: text("initials").notNull(),
    locationLabel: text("location_label").notNull(),
    ...timestamps,
    ...softDelete,
  },
  (table) => [uniqueIndex("academies_slug_idx").on(table.slug)]
);

export const sports = academySchema.table(
  "sports",
  {
    id: primaryId(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("sports_name_idx").on(table.name)]
);

export const academySports = academySchema.table(
  "academy_sports",
  {
    id: primaryId(),
    academyId: uuid("academy_id").notNull(),
    sportId: uuid("sport_id").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("academy_sports_academy_sport_idx").on(table.academyId, table.sportId)]
);

export const batches = academySchema.table("batches", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  sportId: uuid("sport_id").notNull(),
  name: text("name").notNull(),
  scheduleNotes: text("schedule_notes"),
  ...timestamps,
});

/** Roster membership — canonical batch headcount for attendance denominators. */
export const batchEnrollments = academySchema.table(
  "batch_enrollments",
  {
    id: primaryId(),
    batchId: uuid("batch_id").notNull(),
    playerId: uuid("player_id").notNull(),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [uniqueIndex("batch_enrollments_batch_player_idx").on(table.batchId, table.playerId)]
);

/** Coach assignment to a training batch. */
export const batchCoaches = academySchema.table(
  "batch_coaches",
  {
    id: primaryId(),
    batchId: uuid("batch_id").notNull(),
    coachId: uuid("coach_id").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("batch_coaches_batch_coach_idx").on(table.batchId, table.coachId)]
);
