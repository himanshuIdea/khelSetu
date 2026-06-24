"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { StateLoadMoreFooter } from "@/components/state/StateLoadMoreFooter";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { GrantColumnCell } from "@/components/state/funds/GrantColumnCell";
import { GrantDisbursementModal } from "@/components/state/funds/GrantDisbursementModal";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import { api } from "@/lib/api";
import {
  COACH_NIS_FILTER_OPTIONS,
  GRANT_STATUS_FILTER_OPTIONS,
  type GrantStatusFilter,
} from "@/lib/state-fund-filters";
import { stateLayout } from "@/lib/state-layout";
import type {
  StateFundAthleteBeneficiaryRow,
  StateFundBeneficiaryListResult,
  StateFundCoachBeneficiaryRow,
  StateFundNurseryBeneficiaryRow,
  StateFundScheme,
  StateFundSchemeHeader,
} from "@/lib/state-portal";

const PAGE_SIZE = 100;

const DISTRICT_FILTER_OPTIONS = [
  { value: "all", label: "All districts" },
  ...HARYANA_DISTRICTS.map((district) => ({ value: district, label: district })),
];

const SPORT_FILTER_OPTIONS = [
  { value: "all", label: "Sport: All" },
  ...HARYANA_FEATURED_SPORTS.map((sport) => ({ value: sport, label: `Sport: ${sport}` })),
];

const ATHLETE_TABLE = {
  headers: ["Athlete", "Sport", "District", "Nursery", "Grant"],
  columnWidths: ["22%", "20%", "12%", "30%", "16%"],
  columnClassNames: ["min-w-0", "min-w-0", "min-w-0", "min-w-0", "min-w-0"],
} as const;

const COACH_TABLE = {
  headers: ["Coach", "Sport", "District", "Nursery", "NIS", "Grant"],
  columnWidths: ["22%", "18%", "12%", "22%", "10%", "16%"],
  columnClassNames: ["min-w-0", "min-w-0", "min-w-0", "min-w-0", "min-w-0", "min-w-0"],
} as const;

const NURSERY_TABLE = {
  headers: ["Nursery", "District", "Sport", "Athletes", "Grant"],
  columnWidths: ["30%", "14%", "16%", "10%", "30%"],
  columnClassNames: ["min-w-0", "min-w-0", "min-w-0", "min-w-0", "min-w-0"],
} as const;

type SchemeDisbursementWorkspaceProps = {
  initialHeader: StateFundSchemeHeader;
  initialList: StateFundBeneficiaryListResult;
  nurseryFilterOptions: { value: string; label: string }[];
};

function beneficiaryKey(
  beneficiaryType: StateFundScheme["beneficiaryType"],
  row: StateFundAthleteBeneficiaryRow | StateFundCoachBeneficiaryRow | StateFundNurseryBeneficiaryRow
): string {
  if (beneficiaryType === "nursery") {
    return (row as StateFundNurseryBeneficiaryRow).academyId;
  }
  return (row as StateFundAthleteBeneficiaryRow | StateFundCoachBeneficiaryRow).id;
}

function mergeBeneficiaryItems(
  current: StateFundBeneficiaryListResult["items"],
  incoming: StateFundBeneficiaryListResult["items"],
  beneficiaryType: StateFundScheme["beneficiaryType"]
) {
  const seen = new Set(current.map((row) => beneficiaryKey(beneficiaryType, row)));
  const next = incoming.filter((row) => !seen.has(beneficiaryKey(beneficiaryType, row)));
  return [...current, ...next] as StateFundBeneficiaryListResult["items"];
}

export function SchemeDisbursementWorkspace({
  initialHeader,
  initialList,
  nurseryFilterOptions,
}: SchemeDisbursementWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useStatePageSearch();
  const [scheme, setScheme] = useState(initialHeader.scheme);
  const [fiscalYearLabel, setFiscalYearLabel] = useState(initialHeader.fiscalYearLabel);
  const beneficiaryType = initialList.beneficiaryType;

  const [items, setItems] = useState(initialList.items);
  const [total, setTotal] = useState(initialList.total);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [grantFilter, setGrantFilter] = useState<GrantStatusFilter>("all");
  const [nurseryFilter, setNurseryFilter] = useState("all");
  const [nisFilter, setNisFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState<{ id: string; name: string } | null>(null);
  const [markingDisbursementId, setMarkingDisbursementId] = useState<string | null>(null);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fetchGenerationRef = useRef(0);
  const skipInitialRefetchRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);
  const prevFilterSnapshotRef = useRef({
    districtFilter,
    sportFilter,
    grantFilter,
    nurseryFilter,
    nisFilter,
    searchQuery,
  });

  const hasAnyBeneficiaries = initialList.total > 0 || total > 0;
  const hasMore = items.length < total;

  const listParams = useCallback(
    () => ({
      district: districtFilter,
      sport: sportFilter,
      grant: grantFilter,
      nursery: nurseryFilter,
      nis: nisFilter,
      search: searchQuery,
      limit: PAGE_SIZE,
    }),
    [districtFilter, sportFilter, grantFilter, nurseryFilter, nisFilter, searchQuery]
  );

  const listParamsRef = useRef(listParams);
  listParamsRef.current = listParams;

  const refreshSchemeHeader = useCallback(async () => {
    const { detail } = await api.state.funds.schemeDetail(scheme.slug);
    setScheme(detail.scheme);
    setFiscalYearLabel(detail.fiscalYearLabel);
    router.refresh();
  }, [router, scheme.slug]);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!append) {
        fetchGenerationRef.current += 1;
      }
      const requestGeneration = fetchGenerationRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setListError(null);
      }

      try {
        const result = await api.state.funds.listBeneficiaries(scheme.slug, {
          ...listParamsRef.current(),
          offset,
        });
        if (requestGeneration !== fetchGenerationRef.current) return;

        setTotal(result.total);
        setItems((current) => {
          if (!append) return result.items;
          return mergeBeneficiaryItems(current, result.items, beneficiaryType);
        });
      } catch (err) {
        if (requestGeneration !== fetchGenerationRef.current) return;

        const message = err instanceof Error ? err.message : "Failed to load beneficiaries.";
        if (!append) {
          setListError(message);
          setItems([]);
          setTotal(0);
        } else {
          setListError(message);
        }
      } finally {
        if (requestGeneration !== fetchGenerationRef.current) {
          if (append) setLoadingMore(false);
          return;
        }
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [beneficiaryType, scheme.slug]
  );

  useEffect(() => {
    const prev = prevFilterSnapshotRef.current;
    const filtersChanged =
      prev.districtFilter !== districtFilter ||
      prev.sportFilter !== sportFilter ||
      prev.grantFilter !== grantFilter ||
      prev.nurseryFilter !== nurseryFilter ||
      prev.nisFilter !== nisFilter;
    const searchChanged = prev.searchQuery !== searchQuery;
    prevFilterSnapshotRef.current = {
      districtFilter,
      sportFilter,
      grantFilter,
      nurseryFilter,
      nisFilter,
      searchQuery,
    };

    if (skipInitialRefetchRef.current) {
      skipInitialRefetchRef.current = false;
      return;
    }

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    const runRefetch = () => {
      void fetchPage(0, false);
    };

    if (filtersChanged) {
      runRefetch();
      return;
    }

    if (searchChanged) {
      searchDebounceRef.current = window.setTimeout(runRefetch, 300);
    }

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [
    districtFilter,
    sportFilter,
    grantFilter,
    nurseryFilter,
    nisFilter,
    searchQuery,
    fetchPage,
  ]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    void fetchPage(items.length, true);
  }, [fetchPage, hasMore, items.length, loading, loadingMore]);

  async function handleAfterGrant() {
    await Promise.all([refreshSchemeHeader(), fetchPage(0, false)]);
  }

  async function handleMarkGranted(disbursementId: string) {
    setMarkingDisbursementId(disbursementId);
    try {
      await api.state.funds.releasePending(scheme.slug, disbursementId);
      await handleAfterGrant();
    } finally {
      setMarkingDisbursementId(null);
    }
  }

  const subtitle =
    total > 0
      ? `Showing ${items.length.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} beneficiaries · ${scheme.detail} · FY ${fiscalYearLabel} · ${scheme.disbursed} disbursed of ${scheme.allocated}`
      : `${scheme.detail} · FY ${fiscalYearLabel} · ${scheme.disbursed} disbursed of ${scheme.allocated}`;

  const loadMoreFooter =
    hasMore && items.length > 0 ? (
      <StateLoadMoreFooter
        loaded={items.length}
        total={total}
        entityLabel="beneficiaries"
        loading={loadingMore}
        disabled={loading || loadingMore}
        scrollRootRef={tableScrollRef}
        onLoadMore={handleLoadMore}
      />
    ) : undefined;

  function renderTableBody() {
    if (beneficiaryType === "athlete") {
      const rows = items as StateFundAthleteBeneficiaryRow[];
      return rows.map((row) => (
        <TableRow key={row.id}>
          <TableCell className="pl-0 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar initials={row.initials} color={row.color} size="sm" />
              <div className="min-w-0">
                <div className="font-semibold text-[12.5px] text-ink truncate">{row.name}</div>
                <div className="text-[11.5px] text-muted truncate">{row.detail}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate" title={row.sport}>
              {row.sport}
            </div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate">{row.district}</div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate" title={row.nurseryName}>
              {row.nurseryName}
            </div>
          </TableCell>
          <GrantColumnCell
            grant={row.grant}
            onGrant={() => setGrantTarget({ id: row.id, name: row.name })}
            onMarkGranted={handleMarkGranted}
            marking={markingDisbursementId === row.grant.disbursementId}
          />
        </TableRow>
      ));
    }

    if (beneficiaryType === "coach") {
      const rows = items as StateFundCoachBeneficiaryRow[];
      return rows.map((row) => (
        <TableRow key={row.id}>
          <TableCell className="pl-0 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar initials={row.initials} color={row.color} size="sm" />
              <div className="min-w-0">
                <div className="font-semibold text-[12.5px] text-ink truncate">{row.name}</div>
                <div className="text-[11.5px] text-muted truncate">{row.detail}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate">{row.sport}</div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate">{row.district}</div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate" title={row.nurseryName}>
              {row.nurseryName}
            </div>
          </TableCell>
          <TableCell className="min-w-0">
            <div className="truncate">{row.nisLevel}</div>
          </TableCell>
          <GrantColumnCell
            grant={row.grant}
            onGrant={() => setGrantTarget({ id: row.id, name: row.name })}
            onMarkGranted={handleMarkGranted}
            marking={markingDisbursementId === row.grant.disbursementId}
          />
        </TableRow>
      ));
    }

    const rows = items as StateFundNurseryBeneficiaryRow[];
    return rows.map((row) => (
      <TableRow key={row.academyId}>
        <TableCell className="pl-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar initials={row.initials} color={row.color} size="sm" />
            <div className="min-w-0">
              <div className="font-semibold text-[12.5px] text-ink truncate">{row.name}</div>
              <div className="text-[11.5px] text-muted truncate">{row.detail}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="min-w-0">
          <div className="truncate">{row.district}</div>
        </TableCell>
        <TableCell className="min-w-0">
          <div className="truncate">{row.sportLabel}</div>
        </TableCell>
        <TableCell>{row.athletes}</TableCell>
        <GrantColumnCell
          grant={row.grant}
          onGrant={() => setGrantTarget({ id: row.academyId, name: row.name })}
          onMarkGranted={handleMarkGranted}
          marking={markingDisbursementId === row.grant.disbursementId}
        />
      </TableRow>
    ));
  }

  const tableConfig =
    beneficiaryType === "athlete"
      ? ATHLETE_TABLE
      : beneficiaryType === "coach"
        ? COACH_TABLE
        : NURSERY_TABLE;

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={scheme.name}
          subtitle={subtitle}
          action={
            <Link
              href="/state/funds"
              prefetch={false}
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

        {hasAnyBeneficiaries && (
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
        {!hasAnyBeneficiaries && items.length === 0 && !loading ? (
          <StateFilteredEmpty
            entity="beneficiaries"
            description="Registered nurseries need athletes, coaches, or academies before grants can be issued."
          />
        ) : listError && items.length === 0 ? (
          <StateFilteredEmpty entity="beneficiaries" description={listError} />
        ) : items.length === 0 && !loading ? (
          <StateFilteredEmpty
            entity="beneficiaries"
            description="Try changing filters or your search term."
          />
        ) : (
          <div className="relative flex flex-col min-h-0 flex-1">
            <div
              className={`flex flex-col min-h-0 flex-1 transition-opacity ${
                loading && items.length > 0 ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <AcademyTable
                scrollable
                scrollContainerRef={tableScrollRef}
                headers={[...tableConfig.headers]}
                columnWidths={[...tableConfig.columnWidths]}
                columnClassNames={[...tableConfig.columnClassNames]}
                className="flex-1"
                footer={loadMoreFooter}
              >
                {renderTableBody()}
              </AcademyTable>
            </div>

            {loading && items.length > 0 ? (
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-3 pointer-events-none">
                <span className="text-[12px] font-medium text-muted bg-card/95 border border-line rounded-full px-3 py-1 shadow-sm">
                  Updating…
                </span>
              </div>
            ) : null}

            {loading && items.length === 0 ? (
              <p className="text-center text-[13px] text-muted py-6">Loading beneficiaries…</p>
            ) : null}
          </div>
        )}
      </div>

      <GrantDisbursementModal
        open={grantTarget != null}
        onClose={() => setGrantTarget(null)}
        schemeSlug={scheme.slug}
        beneficiaryId={grantTarget?.id ?? ""}
        beneficiaryName={grantTarget?.name ?? ""}
        onGranted={handleAfterGrant}
      />
    </div>
  );
}
