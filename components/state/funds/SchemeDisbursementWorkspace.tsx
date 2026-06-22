"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import {
  GrantDisbursementModal,
  GrantStatusPill,
} from "@/components/state/funds/GrantDisbursementModal";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import {
  COACH_NIS_FILTER_OPTIONS,
  GRANT_STATUS_FILTER_OPTIONS,
  matchesDistrictFilter,
  matchesGrantFilter,
  matchesSportFilter,
  uniqueSorted,
  type GrantStatusFilter,
} from "@/lib/state-fund-filters";
import { stateLayout } from "@/lib/state-layout";
import type {
  StateFundAthleteBeneficiaryRow,
  StateFundCoachBeneficiaryRow,
  StateFundGrantSummary,
  StateFundNurseryBeneficiaryRow,
  StateFundSchemeDetail,
} from "@/lib/state-portal";
import { matchesStateTextSearch } from "@/lib/state-search";

type SchemeDisbursementWorkspaceProps = {
  detail: StateFundSchemeDetail;
};

const DISTRICT_FILTER_OPTIONS = [
  { value: "all", label: "All districts" },
  ...HARYANA_DISTRICTS.map((district) => ({ value: district, label: district })),
];

const SPORT_FILTER_OPTIONS = [
  { value: "all", label: "Sport: All" },
  ...HARYANA_FEATURED_SPORTS.map((sport) => ({ value: sport, label: `Sport: ${sport}` })),
];

function matchesAthleteSearch(row: StateFundAthleteBeneficiaryRow, query: string) {
  return matchesStateTextSearch(query, [
    row.name,
    row.detail,
    row.sport,
    row.district,
    row.nurseryName,
  ]);
}

function matchesCoachSearch(row: StateFundCoachBeneficiaryRow, query: string) {
  return matchesStateTextSearch(query, [
    row.name,
    row.detail,
    row.sport,
    row.district,
    row.nurseryName,
    row.nisLevel,
  ]);
}

function matchesNurserySearch(row: StateFundNurseryBeneficiaryRow, query: string) {
  return matchesStateTextSearch(query, [
    row.name,
    row.detail,
    row.district,
    row.sportLabel,
  ]);
}

const GRANT_ACTION_BUTTON_CLASS =
  "inline-flex items-center shrink-0 whitespace-nowrap text-[12px] font-semibold text-brand hover:underline disabled:opacity-50";

function GrantActionButton({
  grant,
  onGrant,
  onMarkGranted,
  marking,
}: {
  grant: StateFundGrantSummary;
  onGrant: () => void;
  onMarkGranted: (disbursementId: string) => void;
  marking: boolean;
}) {
  if (grant.status === "paid") return null;

  if (grant.status === "pending" && grant.disbursementId) {
    return (
      <button
        type="button"
        onClick={() => onMarkGranted(grant.disbursementId!)}
        disabled={marking}
        className={GRANT_ACTION_BUTTON_CLASS}
      >
        {marking ? "Saving…" : "Mark granted"}
      </button>
    );
  }

  return (
    <button type="button" onClick={onGrant} className={GRANT_ACTION_BUTTON_CLASS}>
      Grant
    </button>
  );
}

function GrantColumnCell({
  grant,
  onGrant,
  onMarkGranted,
  marking,
}: {
  grant: StateFundGrantSummary;
  onGrant: () => void;
  onMarkGranted: (disbursementId: string) => void;
  marking: boolean;
}) {
  const action =
    grant.status === "paid" ? null : (
      <GrantActionButton
        grant={grant}
        onGrant={onGrant}
        onMarkGranted={onMarkGranted}
        marking={marking}
      />
    );

  return (
    <TableCell className="pr-0">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0 w-full">
        <GrantStatusPill status={grant.status} amountPaise={grant.amountPaise} />
        {action ? <span className="shrink-0 ml-auto">{action}</span> : null}
      </div>
    </TableCell>
  );
}

export function SchemeDisbursementWorkspace({ detail: initialDetail }: SchemeDisbursementWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useStatePageSearch();
  const [detail, setDetail] = useState(initialDetail);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [grantFilter, setGrantFilter] = useState<GrantStatusFilter>("all");
  const [nurseryFilter, setNurseryFilter] = useState("all");
  const [nisFilter, setNisFilter] = useState("all");
  const [grantTarget, setGrantTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [markingDisbursementId, setMarkingDisbursementId] = useState<string | null>(null);

  const { scheme } = detail;
  const beneficiaryType = scheme.beneficiaryType;

  const nurseryFilterOptions = useMemo(() => {
    const names = uniqueSorted(
      (detail.athleteBeneficiaries ?? []).map((row) => row.nurseryName)
    );
    return [
      { value: "all", label: "Nursery: All" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [detail.athleteBeneficiaries]);

  const athleteRows = useMemo(() => {
    return (detail.athleteBeneficiaries ?? []).filter((row) => {
      if (!matchesAthleteSearch(row, searchQuery)) return false;
      if (!matchesDistrictFilter(row.district, districtFilter)) return false;
      if (!matchesSportFilter("athlete", row.sport, sportFilter)) return false;
      if (!matchesGrantFilter(row.grant.status, grantFilter)) return false;
      if (nurseryFilter !== "all" && row.nurseryName !== nurseryFilter) return false;
      return true;
    });
  }, [
    detail.athleteBeneficiaries,
    searchQuery,
    districtFilter,
    sportFilter,
    grantFilter,
    nurseryFilter,
  ]);

  const coachRows = useMemo(() => {
    return (detail.coachBeneficiaries ?? []).filter((row) => {
      if (!matchesCoachSearch(row, searchQuery)) return false;
      if (!matchesDistrictFilter(row.district, districtFilter)) return false;
      if (!matchesSportFilter("coach", row.sport, sportFilter)) return false;
      if (!matchesGrantFilter(row.grant.status, grantFilter)) return false;
      if (nisFilter !== "all" && row.nisLevel !== nisFilter) return false;
      return true;
    });
  }, [
    detail.coachBeneficiaries,
    searchQuery,
    districtFilter,
    sportFilter,
    grantFilter,
    nisFilter,
  ]);

  const nurseryRows = useMemo(() => {
    return (detail.nurseryBeneficiaries ?? []).filter((row) => {
      if (!matchesNurserySearch(row, searchQuery)) return false;
      if (!matchesDistrictFilter(row.district, districtFilter)) return false;
      if (!matchesSportFilter("nursery", row.sportLabel, sportFilter)) return false;
      if (!matchesGrantFilter(row.grant.status, grantFilter)) return false;
      return true;
    });
  }, [
    detail.nurseryBeneficiaries,
    searchQuery,
    districtFilter,
    sportFilter,
    grantFilter,
  ]);

  const rows =
    beneficiaryType === "athlete"
      ? athleteRows
      : beneficiaryType === "coach"
        ? coachRows
        : nurseryRows;

  const totalRows =
    beneficiaryType === "athlete"
      ? (detail.athleteBeneficiaries ?? []).length
      : beneficiaryType === "coach"
        ? (detail.coachBeneficiaries ?? []).length
        : (detail.nurseryBeneficiaries ?? []).length;

  async function refreshDetail() {
    const { api } = await import("@/lib/api");
    const { detail: next } = await api.state.funds.schemeDetail(scheme.slug);
    setDetail(next);
    router.refresh();
  }

  async function handleMarkGranted(disbursementId: string) {
    setMarkingDisbursementId(disbursementId);
    try {
      const { api } = await import("@/lib/api");
      await api.state.funds.releasePending(scheme.slug, disbursementId);
      await refreshDetail();
    } finally {
      setMarkingDisbursementId(null);
    }
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={scheme.name}
          subtitle={`${scheme.detail} · FY ${detail.fiscalYearLabel} · ${scheme.disbursed} disbursed of ${scheme.allocated}`}
          action={
            <Link
              href="/state/funds"
              className="inline-flex items-center justify-center gap-[7px] bg-card border border-line text-ink font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
            >
              Back to funds
            </Link>
          }
        />

        <div className="flex flex-wrap gap-2 mb-3">
          <Pill variant="grey">{scheme.beneficiaries} beneficiaries paid</Pill>
          <Pill variant="grey">{scheme.util}% utilised</Pill>
        </div>

        {totalRows > 0 && (
          <FilterPills>
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by district"
              value={districtFilter}
              onChange={setDistrictFilter}
              active={districtFilter !== "all"}
              menuMaxHeightClass="max-h-52"
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={DISTRICT_FILTER_OPTIONS}
            />
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by sport"
              value={sportFilter}
              onChange={setSportFilter}
              active={sportFilter !== "all"}
              menuMaxHeightClass="max-h-52"
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={SPORT_FILTER_OPTIONS}
            />
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by grant status"
              value={grantFilter}
              onChange={(value) => setGrantFilter(value as GrantStatusFilter)}
              active={grantFilter !== "all"}
              menuMaxHeightClass="max-h-52"
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={GRANT_STATUS_FILTER_OPTIONS}
            />
            {beneficiaryType === "athlete" && (
              <InlineSelect
                variant="pill"
                filterPill
                aria-label="Filter by nursery"
                value={nurseryFilter}
                onChange={setNurseryFilter}
                active={nurseryFilter !== "all"}
                menuMaxHeightClass="max-h-52"
                className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
                options={nurseryFilterOptions}
              />
            )}
            {beneficiaryType === "coach" && (
              <InlineSelect
                variant="pill"
                filterPill
                aria-label="Filter by NIS level"
                value={nisFilter}
                onChange={setNisFilter}
                active={nisFilter !== "all"}
                menuMaxHeightClass="max-h-52"
                className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
                options={[...COACH_NIS_FILTER_OPTIONS]}
              />
            )}
          </FilterPills>
        )}
      </div>

      <div className={stateLayout.listScrollRegion}>
        {totalRows === 0 ? (
          <StateFilteredEmpty
            entity="beneficiaries"
            description="Registered nurseries need athletes, coaches, or academies before grants can be issued."
          />
        ) : rows.length === 0 ? (
          <StateFilteredEmpty
            entity="beneficiaries"
            description="Try changing filters or your search term."
          />
        ) : beneficiaryType === "athlete" ? (
          <AcademyTable
            scrollable
            headers={["Athlete", "Sport", "District", "Nursery", "Grant"]}
          >
            {athleteRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.sport}</TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.nurseryName}</TableCell>
                <GrantColumnCell
                  grant={row.grant}
                  onGrant={() => setGrantTarget({ id: row.id, name: row.name })}
                  onMarkGranted={handleMarkGranted}
                  marking={markingDisbursementId === row.grant.disbursementId}
                />
              </TableRow>
            ))}
          </AcademyTable>
        ) : beneficiaryType === "coach" ? (
          <AcademyTable
            scrollable
            headers={["Coach", "Sport", "District", "Nursery", "NIS", "Grant"]}
          >
            {coachRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.sport}</TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.nurseryName}</TableCell>
                <TableCell>{row.nisLevel}</TableCell>
                <GrantColumnCell
                  grant={row.grant}
                  onGrant={() => setGrantTarget({ id: row.id, name: row.name })}
                  onMarkGranted={handleMarkGranted}
                  marking={markingDisbursementId === row.grant.disbursementId}
                />
              </TableRow>
            ))}
          </AcademyTable>
        ) : (
          <AcademyTable
            scrollable
            headers={["Nursery", "District", "Sport", "Athletes", "Grant"]}
          >
            {nurseryRows.map((row) => (
              <TableRow key={row.academyId}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.sportLabel}</TableCell>
                <TableCell>{row.athletes}</TableCell>
                <GrantColumnCell
                  grant={row.grant}
                  onGrant={() => setGrantTarget({ id: row.academyId, name: row.name })}
                  onMarkGranted={handleMarkGranted}
                  marking={markingDisbursementId === row.grant.disbursementId}
                />
              </TableRow>
            ))}
          </AcademyTable>
        )}
      </div>

      <GrantDisbursementModal
        open={grantTarget != null}
        onClose={() => setGrantTarget(null)}
        schemeSlug={scheme.slug}
        beneficiaryId={grantTarget?.id ?? ""}
        beneficiaryName={grantTarget?.name ?? ""}
        onGranted={refreshDetail}
      />
    </div>
  );
}
