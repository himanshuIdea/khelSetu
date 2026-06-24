import { cache } from "react";
import type { StateReportType } from "@/lib/state-report-catalog";
import type {
  ScoutingShortlistReportRow,
  StateDistrictRow,
  StateFundSchemeDetail,
  StateFundsDashboard,
  VerificationBreakdown,
} from "@/lib/state-portal";
import type { VerificationQueueItem } from "@/lib/state-verification-queue";
import { hasPendingOnboardingRequests } from "@/lib/repositories/academy-onboarding";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
import { listStateDistrictRollup } from "@/lib/repositories/state-districts";
import {
  fetchAllSchemeReportDetails,
  getStateFundsDashboard,
  hasFundReportData,
} from "@/lib/repositories/state-funds";
import { getStateNurseryContext } from "@/lib/repositories/state-nursery-helpers";
import { countShortlistReportRows, listShortlistReportRows } from "@/lib/repositories/state-scouting";
import { listVerificationQueue } from "@/lib/repositories/state-verification";

export type DistrictReportData = {
  districts: StateDistrictRow[];
};

export type FundReportData = {
  dashboard: StateFundsDashboard;
  schemeDetails: StateFundSchemeDetail[];
};

export type TalentPipelineReportData = {
  rows: ScoutingShortlistReportRow[];
};

export type VerificationReportData = {
  breakdown: VerificationBreakdown;
  queue: VerificationQueueItem[];
};

export type FullStateReportData = {
  districts: DistrictReportData;
  funds: FundReportData;
  talent: TalentPipelineReportData;
  verification: VerificationReportData;
};

export type StateReportData =
  | DistrictReportData
  | FundReportData
  | TalentPipelineReportData
  | VerificationReportData
  | FullStateReportData;

export async function fetchDistrictReportData(): Promise<DistrictReportData> {
  const districts = await listStateDistrictRollup();
  return { districts };
}

export async function fetchFundReportData(): Promise<FundReportData> {
  const dashboard = await getStateFundsDashboard();
  const schemeDetails = await fetchAllSchemeReportDetails();
  return {
    dashboard,
    schemeDetails,
  };
}

export async function fetchTalentPipelineReportData(): Promise<TalentPipelineReportData> {
  const rows = await listShortlistReportRows();
  return { rows };
}

export async function fetchVerificationReportData(): Promise<VerificationReportData> {
  const breakdown = await getVerificationBreakdown();
  const queue = await listVerificationQueue();
  return { breakdown, queue };
}

export async function fetchFullStateReportData(): Promise<FullStateReportData> {
  const [districts, funds, talent, verification] = await Promise.all([
    fetchDistrictReportData(),
    fetchFundReportData(),
    fetchTalentPipelineReportData(),
    fetchVerificationReportData(),
  ]);
  return { districts, funds, talent, verification };
}

export async function fetchStateReportData(type: StateReportType): Promise<StateReportData> {
  switch (type) {
    case "district-performance":
      return fetchDistrictReportData();
    case "fund-utilisation":
      return fetchFundReportData();
    case "talent-pipeline":
      return fetchTalentPipelineReportData();
    case "verification-compliance":
      return fetchVerificationReportData();
    case "full-state":
      return fetchFullStateReportData();
  }
}

function districtHasData(data: DistrictReportData): boolean {
  return data.districts.some(
    (d) => d.nurseries > 0 || d.athleteCount > 0 || d.coaches > 0
  );
}

function fundHasData(data: FundReportData): boolean {
  for (const detail of data.schemeDetails) {
    for (const rows of [
      detail.athleteBeneficiaries,
      detail.coachBeneficiaries,
      detail.nurseryBeneficiaries,
    ]) {
      for (const row of rows ?? []) {
        if (row.grant.status === "pending" || row.grant.status === "paid") {
          return true;
        }
      }
    }
  }
  return data.dashboard.schemes.some(
    (scheme) => scheme.allocatedPaise > 0 || scheme.disbursedPaise > 0
  );
}

function talentHasData(data: TalentPipelineReportData): boolean {
  return data.rows.length > 0;
}

function verificationHasData(data: VerificationReportData): boolean {
  const { breakdown, queue } = data;
  return (
    queue.length > 0 ||
    breakdown.verified > 0 ||
    breakdown.pending > 0 ||
    breakdown.flagged > 0
  );
}

function fullStateHasData(data: FullStateReportData): boolean {
  return (
    districtHasData(data.districts) ||
    fundHasData(data.funds) ||
    talentHasData(data.talent) ||
    verificationHasData(data.verification)
  );
}

export function reportDataHasContent(type: StateReportType, data: StateReportData): boolean {
  switch (type) {
    case "district-performance":
      return districtHasData(data as DistrictReportData);
    case "fund-utilisation":
      return fundHasData(data as FundReportData);
    case "talent-pipeline":
      return talentHasData(data as TalentPipelineReportData);
    case "verification-compliance":
      return verificationHasData(data as VerificationReportData);
    case "full-state":
      return fullStateHasData(data as FullStateReportData);
  }
}

function verificationHasReportData(
  breakdown: VerificationBreakdown,
  academyIds: string[],
  hasPendingOnboarding: boolean
): boolean {
  return (
    breakdown.verified + breakdown.pending + breakdown.flagged > 0 ||
    academyIds.length > 0 ||
    hasPendingOnboarding
  );
}

export const getStateReportAvailability = cache(
  async (): Promise<Record<StateReportType, boolean>> => {
    const { academyIds } = await getStateNurseryContext();
    const verification = await getVerificationBreakdown();
    const fundAvailable = await hasFundReportData();
    const shortlistCount = await countShortlistReportRows();
    const hasPendingOnboarding = await hasPendingOnboardingRequests();

    const districtAvailable = academyIds.length > 0;
    const talentAvailable = shortlistCount > 0;
    const verificationAvailable = verificationHasReportData(
      verification,
      academyIds,
      hasPendingOnboarding
    );

    return {
      "district-performance": districtAvailable,
      "fund-utilisation": fundAvailable,
      "talent-pipeline": talentAvailable,
      "verification-compliance": verificationAvailable,
      "full-state":
        districtAvailable ||
        fundAvailable ||
        talentAvailable ||
        verificationAvailable,
    };
  }
);

export const statePortalHasAnyData = cache(async (): Promise<boolean> => {
  const { academyIds } = await getStateNurseryContext();
  return academyIds.length > 0;
});

export function emptyReportMessage(type: StateReportType): string {
  switch (type) {
    case "district-performance":
      return "No district data available to include in the report.";
    case "fund-utilisation":
      return "No fund utilisation data available to include in the report.";
    case "talent-pipeline":
      return "No shortlisted athletes to include in the report.";
    case "verification-compliance":
      return "No verification data available to include in the report.";
    case "full-state":
      return "No state data available to include in the report.";
  }
}
