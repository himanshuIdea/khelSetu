import { cache } from "react";
import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stateReportExports } from "@/db/schema";
import type { StateReportType } from "@/lib/state-report-catalog";
import type { StateReportsDashboard } from "@/lib/state-portal";
import type { ReportFormat } from "@/lib/state-report-generators";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
import {
  isPendingReviewQueueItem,
  listVerificationQueue,
} from "@/lib/repositories/state-verification";

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

  const [totalRow, monthRow, verification, queue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(stateReportExports),
    db
      .select({ count: sql<number>`count(*)` })
      .from(stateReportExports)
      .where(gte(stateReportExports.generatedAt, monthStart)),
    getVerificationBreakdown(),
    listVerificationQueue(),
  ]);

  const totalExports = Number(totalRow[0]?.count ?? 0);
  const pendingReview = queue.filter(isPendingReviewQueueItem).length;

  return {
    generatedThisMonth: Number(monthRow[0]?.count ?? 0),
    scheduledExports: 0,
    pendingReview,
    complianceCoverage: verification.rate,
    totalExports,
  };
});
