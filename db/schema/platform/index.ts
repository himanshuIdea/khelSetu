import { fundingTypeEnum } from "../academy";
import { coaches, players } from "../people";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";
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

export const nurseryFlagResponseStatusEnum = pgEnum("nursery_flag_response_status", [
  "none",
  "addressed",
  "review_requested",
]);

export const academyOnboardingStatusEnum = pgEnum("academy_onboarding_status", [
  "draft",
  "submitted",
  "under_review",
  "needs_action",
  "approved",
  "rejected",
]);

export const academyOnboardingRequestTypeEnum = pgEnum("academy_onboarding_request_type", [
  "initial",
  "resubmission",
]);

export const stateFundSchemeBeneficiaryTypeEnum = pgEnum("state_fund_scheme_beneficiary_type", [
  "athlete",
  "coach",
  "nursery",
]);

export const stateFundDisbursementStatusEnum = pgEnum("state_fund_disbursement_status", [
  "pending",
  "paid",
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
    flagNote: text("flag_note"),
    flagGuidelines: text("flag_guidelines"),
    flaggedAt: timestamp("flagged_at", { withTimezone: true }),
    flaggedByUserId: uuid("flagged_by_user_id").references(() => users.id),
    flagResponseStatus: nurseryFlagResponseStatusEnum("flag_response_status")
      .notNull()
      .default("none"),
    flagResponseNote: text("flag_response_note"),
    flagResponseAt: timestamp("flag_response_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("state_nursery_registrations_academy_idx").on(table.academyId)]
);

/** Academy admin onboarding verification requests (state-reviewed). */
export const academyOnboardingRequests = platformSchema.table(
  "academy_onboarding_requests",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: academyOnboardingStatusEnum("status").notNull().default("draft"),
    requestType: academyOnboardingRequestTypeEnum("request_type").notNull().default("initial"),
    academyName: text("academy_name"),
    district: text("district"),
    slug: text("slug"),
    sports: jsonb("sports").$type<string[]>().notNull().default([]),
    fundingType: fundingTypeEnum("funding_type").notNull().default("govt_aided"),
    brandColor: text("brand_color").notNull().default("#FF6B2C"),
    aadharNumber: text("aadhar_number"),
    panNumber: text("pan_number"),
    gstNumber: text("gst_number"),
    aadharDocumentKey: text("aadhar_document_key"),
    panDocumentKey: text("pan_document_key"),
    gstDocumentKey: text("gst_document_key"),
    reviewNotes: text("review_notes"),
    requiredActions: jsonb("required_actions").$type<string[]>().notNull().default([]),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    academyId: uuid("academy_id").references(() => academies.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("academy_onboarding_requests_user_idx").on(table.userId),
    index("academy_onboarding_requests_status_idx").on(table.status),
    index("academy_onboarding_requests_submitted_at_idx").on(table.submittedAt),
  ]
);

/** State fiscal year (e.g. FY 2026-27). */
export const stateFiscalYears = platformSchema.table(
  "state_fiscal_years",
  {
    id: primaryId(),
    label: text("label").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    totalAllocatedAmountPaise: bigint("total_allocated_amount_paise", { mode: "number" })
      .notNull()
      .default(0),
    ...timestamps,
  },
  (table) => [uniqueIndex("state_fiscal_years_label_idx").on(table.label)]
);

/** DBT scheme under a fiscal year. */
export const stateFundSchemes = platformSchema.table(
  "state_fund_schemes",
  {
    id: primaryId(),
    fiscalYearId: uuid("fiscal_year_id")
      .notNull()
      .references(() => stateFiscalYears.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle").notNull(),
    beneficiaryType: stateFundSchemeBeneficiaryTypeEnum("beneficiary_type").notNull(),
    allocatedAmountPaise: bigint("allocated_amount_paise", { mode: "number" }).notNull().default(0),
    color: text("color").notNull().default("#12B886"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("state_fund_schemes_fy_slug_idx").on(table.fiscalYearId, table.slug),
    index("state_fund_schemes_fiscal_year_idx").on(table.fiscalYearId),
  ]
);

/** Individual grant/disbursement to athlete, coach, or nursery. */
export const stateFundDisbursements = platformSchema.table(
  "state_fund_disbursements",
  {
    id: primaryId(),
    schemeId: uuid("scheme_id")
      .notNull()
      .references(() => stateFundSchemes.id),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    status: stateFundDisbursementStatusEnum("status").notNull().default("pending"),
    playerId: uuid("player_id").references(() => players.id),
    coachId: uuid("coach_id").references(() => coaches.id),
    academyId: uuid("academy_id").references(() => academies.id),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    referenceNote: text("reference_note"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    paidByUserId: uuid("paid_by_user_id").references(() => users.id),
    ...timestamps,
  },
  (table) => [
    index("state_fund_disbursements_scheme_idx").on(table.schemeId),
    index("state_fund_disbursements_status_idx").on(table.status),
    index("state_fund_disbursements_player_idx").on(table.playerId),
    index("state_fund_disbursements_coach_idx").on(table.coachId),
    index("state_fund_disbursements_academy_idx").on(table.academyId),
  ]
);
