import { cache } from "react";
import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stateReportExports } from "@/db/schema";
import type { StateReportType } from "@/lib/state-report-catalog";
import { STATE_REPORT_TYPES } from "@/lib/state-report-catalog";
import type { StateReportsDashboard } from "@/lib/state-portal";
import type { ReportFormat } from "@/lib/state-report-generators";
import { hasPendingOnboardingRequests } from "@/lib/repositories/academy-onboarding";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
import { hasFundReportData } from "@/lib/repositories/state-funds";
import { getStateNurseryContext } from "@/lib/repositories/state-nursery-helpers";
import { countShortlistReportRows } from "@/lib/repositories/state-scouting";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function recordStateReportExport(
  reportType: StateReportType,
  format: ReportFormat,
  generatedByUserId: string
): Promise<void> {
  await db.insert(stateReportExports).values({
    reportType,
    format,
    generatedByUserId,
    generatedAt: new Date(),
  });
}

export const getStateReportsDashboard = cache(async (): Promise<StateReportsDashboard> => {
  const monthStart = startOfMonth();

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(stateReportExports);
  const monthRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(stateReportExports)
    .where(gte(stateReportExports.generatedAt, monthStart));
  const verification = await getVerificationBreakdown();

  const totalExports = Number(totalRow[0]?.count ?? 0);
  const pendingReview = verification.pending + verification.flagged;

  return {
    generatedThisMonth: Number(monthRow[0]?.count ?? 0),
    scheduledExports: 0,
    pendingReview,
    complianceCoverage: verification.rate,
    totalExports,
  };
});

export type ReportsPageData = {
  dashboard: StateReportsDashboard;
  reportAvailability: Record<StateReportType, boolean>;
  hasPortalData: boolean;
};

/** Single serialized loader for /state/reports — safe on Vercel's 1-connection pool. */
export const loadReportsPageData = cache(async (): Promise<ReportsPageData> => {
  const { academyIds } = await getStateNurseryContext();
  const verification = await getVerificationBreakdown();

  const monthStart = startOfMonth();
  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(stateReportExports);
  const monthRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(stateReportExports)
    .where(gte(stateReportExports.generatedAt, monthStart));

  const fundAvailable = await hasFundReportData();
  const shortlistCount = await countShortlistReportRows();
  const hasPendingOnboarding = await hasPendingOnboardingRequests();

  const districtAvailable = academyIds.length > 0;
  const talentAvailable = shortlistCount > 0;
  const verificationAvailable =
    verification.verified + verification.pending + verification.flagged > 0 ||
    academyIds.length > 0 ||
    hasPendingOnboarding;

  const reportAvailability: Record<StateReportType, boolean> = {
    "district-performance": districtAvailable,
    "fund-utilisation": fundAvailable,
    "talent-pipeline": talentAvailable,
    "verification-compliance": verificationAvailable,
    "full-state":
      districtAvailable || fundAvailable || talentAvailable || verificationAvailable,
  };

  const totalExports = Number(totalRow[0]?.count ?? 0);
  const pendingReview = verification.pending + verification.flagged;

  return {
    dashboard: {
      generatedThisMonth: Number(monthRow[0]?.count ?? 0),
      scheduledExports: STATE_REPORT_TYPES.filter((type) => reportAvailability[type]).length,
      pendingReview,
      complianceCoverage: verification.rate,
      totalExports,
    },
    reportAvailability,
    hasPortalData: academyIds.length > 0,
  };
});
