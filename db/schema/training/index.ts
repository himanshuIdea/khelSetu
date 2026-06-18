import { integer, jsonb, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { academies, batches, sports } from "../academy";
import { users } from "../identity";
import { coaches, players } from "../people";
import { primaryId, timestamps } from "../_shared";

export const trainingSchema = pgSchema("training");

export const drillSubmissionStatusEnum = pgEnum("drill_submission_status", [
  "pending",
  "reviewed",
]);

export const mediaFeedItemTypeEnum = pgEnum("media_feed_item_type", [
  "player_submission",
  "coach_post",
]);

export type MediaFeedItemType = "player_submission" | "coach_post";

export const coachDrillPosts = trainingSchema.table("coach_drill_posts", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coaches.id),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  batchId: uuid("batch_id").references(() => batches.id),
  drillName: text("drill_name").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailGradient: text("thumbnail_gradient"),
  durationSeconds: integer("duration_seconds"),
  postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedByCoachId: uuid("published_by_coach_id").references(() => coaches.id),
  ...timestamps,
});

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
  drillPostId: uuid("drill_post_id").references(() => coachDrillPosts.id),
  drillName: text("drill_name").notNull(),
  videoUrl: text("video_url"),
  thumbnailGradient: text("thumbnail_gradient"),
  durationSeconds: integer("duration_seconds"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  status: drillSubmissionStatusEnum("status").notNull().default("pending"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedByCoachId: uuid("published_by_coach_id").references(() => coaches.id),
  ...timestamps,
});

export type DrillReviewCriteriaScores = {
  technique?: number;
  speed?: number;
  form?: number;
};

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
    criteriaScores: jsonb("criteria_scores").$type<DrillReviewCriteriaScores>(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [uniqueIndex("drill_reviews_submission_idx").on(table.submissionId)]
);

export const mediaPostLikes = trainingSchema.table(
  "media_post_likes",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    itemType: mediaFeedItemTypeEnum("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("media_post_likes_unique_idx").on(table.userId, table.itemType, table.itemId)]
);

export const mediaPostComments = trainingSchema.table("media_post_comments", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  itemType: mediaFeedItemTypeEnum("item_type").notNull(),
  itemId: uuid("item_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerFollows = trainingSchema.table(
  "player_follows",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    followerPlayerId: uuid("follower_player_id")
      .notNull()
      .references(() => players.id),
    followedPlayerId: uuid("followed_player_id")
      .notNull()
      .references(() => players.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("player_follows_unique_idx").on(table.followerPlayerId, table.followedPlayerId)]
);
