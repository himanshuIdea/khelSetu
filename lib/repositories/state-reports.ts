import { cache } from "react";
import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reportExports } from "@/db/schema";
import type { StateReportsDashboard } from "@/lib/state-portal";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export const getStateReportsDashboard = cache(async (): Promise<StateReportsDashboard> => {
  const monthStart = startOfMonth();

  const [totalRow, monthRow, typeRow, pendingRow, readyRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reportExports),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reportExports)
      .where(gte(reportExports.generatedAt, monthStart)),
    db
      .select({ count: sql<number>`count(distinct ${reportExports.reportType})` })
      .from(reportExports),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reportExports)
      .where(eq(reportExports.status, "pending")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reportExports)
      .where(eq(reportExports.status, "ready")),
  ]);

  const totalExports = Number(totalRow[0]?.count ?? 0);
  const readyCount = Number(readyRow[0]?.count ?? 0);
  const complianceCoverage =
    totalExports > 0 ? Math.round((readyCount / totalExports) * 100) : 0;

  return {
    generatedThisMonth: Number(monthRow[0]?.count ?? 0),
    scheduledExports: Number(typeRow[0]?.count ?? 0),
    pendingReview: Number(pendingRow[0]?.count ?? 0),
    complianceCoverage,
    totalExports,
  };
});
