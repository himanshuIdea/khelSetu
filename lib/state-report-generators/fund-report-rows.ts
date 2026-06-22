import type { FundReportData } from "@/lib/repositories/state-report-data";
import type { StateFundSchemeDetail } from "@/lib/state-portal";
import { formatGrantAmount, formatGrantStatus } from "./shared";

export function isReportableGrant(status: "none" | "pending" | "paid"): boolean {
  return status === "pending" || status === "paid";
}

export function filterSchemeDetailBeneficiaries(
  detail: StateFundSchemeDetail
): StateFundSchemeDetail {
  return {
    ...detail,
    athleteBeneficiaries: detail.athleteBeneficiaries?.filter((row) =>
      isReportableGrant(row.grant.status)
    ),
    coachBeneficiaries: detail.coachBeneficiaries?.filter((row) =>
      isReportableGrant(row.grant.status)
    ),
    nurseryBeneficiaries: detail.nurseryBeneficiaries?.filter((row) =>
      isReportableGrant(row.grant.status)
    ),
  };
}

export function countReportableBeneficiaries(detail: StateFundSchemeDetail): number {
  const filtered = filterSchemeDetailBeneficiaries(detail);
  return (
    (filtered.athleteBeneficiaries?.length ?? 0) +
    (filtered.coachBeneficiaries?.length ?? 0) +
    (filtered.nurseryBeneficiaries?.length ?? 0)
  );
}

export function countAllReportableBeneficiaries(data: FundReportData): number {
  return data.schemeDetails.reduce(
    (sum, detail) => sum + countReportableBeneficiaries(detail),
    0
  );
}

export function fundReportHasBeneficiaries(data: FundReportData): boolean {
  if (countAllReportableBeneficiaries(data) > 0) return true;
  return data.dashboard.schemes.some(
    (scheme) => scheme.allocatedPaise > 0 || scheme.disbursedPaise > 0
  );
}

function beneficiaryRowsForDetail(detail: StateFundSchemeDetail): string[][] {
  const filtered = filterSchemeDetailBeneficiaries(detail);
  const schemeName = filtered.scheme.name;
  const rows: string[][] = [];

  for (const row of filtered.athleteBeneficiaries ?? []) {
    rows.push([
      schemeName,
      row.name,
      row.district,
      row.nurseryName,
      row.sport,
      formatGrantStatus(row.grant.status),
      formatGrantAmount(row.grant.amountPaise),
    ]);
  }

  for (const row of filtered.coachBeneficiaries ?? []) {
    rows.push([
      schemeName,
      row.name,
      row.district,
      row.nurseryName,
      `${row.sport} · ${row.nisLevel}`,
      formatGrantStatus(row.grant.status),
      formatGrantAmount(row.grant.amountPaise),
    ]);
  }

  for (const row of filtered.nurseryBeneficiaries ?? []) {
    rows.push([
      schemeName,
      row.name,
      row.district,
      "—",
      `${row.sportLabel} · ${row.athletes} athletes`,
      formatGrantStatus(row.grant.status),
      formatGrantAmount(row.grant.amountPaise),
    ]);
  }

  return rows;
}

export function beneficiaryDetailRowsForReport(data: FundReportData): string[][] {
  return data.schemeDetails.flatMap((detail) => beneficiaryRowsForDetail(detail));
}

export function schemeSummaryRowsForReport(data: FundReportData): string[][] {
  const detailBySchemeId = new Map(
    data.schemeDetails.map((detail) => [detail.scheme.id, detail])
  );

  return data.dashboard.schemes.map((scheme) => {
    const detail = detailBySchemeId.get(scheme.id);
    const beneficiaryCount = detail ? countReportableBeneficiaries(detail) : 0;

    return [
      scheme.name,
      scheme.beneficiaryType,
      scheme.allocated,
      scheme.disbursed,
      `${scheme.util}%`,
      String(beneficiaryCount),
    ];
  });
}

export function dashboardSummaryRowsForReport(data: FundReportData): string[][] {
  const { dashboard } = data;
  return [
    ["Fiscal year", dashboard.fiscalYearLabel],
    ["Total disbursed", dashboard.totalDisbursed],
    ["Allocation used", `${dashboard.allocationPercent}%`],
    ["Beneficiaries (pending + paid)", String(countAllReportableBeneficiaries(data))],
    ["Pending approval", String(dashboard.pendingApproval)],
    ["Paid on time rate", `${dashboard.paidOnTimeRate}%`],
  ];
}
