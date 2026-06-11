import { pgEnum, pgSchema, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
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
