"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UpIcon } from "@/components/academy/icons";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  ScrollableListPanel,
  SectionTitle,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { FillBarRow } from "@/components/state/shared";
import {
  ReportFormatPopover,
  type ReportFormat,
} from "@/components/state/ReportFormatPopover";
import { StateFilteredEmpty, StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { StateLoadMoreFooter } from "@/components/state/StateLoadMoreFooter";
import { RatingFilterSlider } from "@/components/state/RatingFilterSlider";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { api } from "@/lib/api";
import { formatSportWeightLine } from "@/lib/format";
import {
  SCOUTING_STATUS_FILTER_OPTIONS,
  SCOUTING_STATUS_OPTIONS,
  SCOUTING_STATUS_SELECT_OPTIONS,
  type ScoutingStatus,
} from "@/lib/scouting-status";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { StateScoutingDashboard, StateScoutingProspect } from "@/lib/state-portal";

function ScoutingStatTile({
  value,
  label,
  valueColor,
}: {
  value: React.ReactNode;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-card border border-line rounded-(--radius) px-3 py-2 min-w-0">
      <div
        className="font-bold text-[19px] text-ink tracking-tight leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-muted mt-1 leading-snug">{label}</div>
    </div>
  );
}

function TalentPipelinePanel({
  dashboard,
  hasPipeline,
  className = "",
}: {
  dashboard: StateScoutingDashboard;
  hasPipeline: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-line rounded-(--radius) px-3 py-2 min-w-0 w-full h-full ${className}`}
    >
      <div className="text-[12.5px] font-bold text-ink">Talent pipeline</div>
      {hasPipeline ? (
        <>
          <div className="mt-2">
            {dashboard.pipeline.map((stage) => (
              <FillBarRow
                key={stage.label}
                label={stage.label}
                value={stage.value}
                percent={stage.percent}
                color={stage.color}
                labelWidth="w-[4rem]"
                compact
              />
            ))}
          </div>
          <div className="border-t border-line2 pt-1.5 mt-2">
            <div className="text-[10px] text-muted mb-0.5">By age group</div>
            <div className="space-y-0.5">
              {dashboard.ageGroups.map((group) => (
                <div
                  key={group.label}
                  className="flex items-center gap-1 text-[10px] text-muted min-w-0"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: group.color }}
                  />
                  <span className="truncate">{group.label}</span>
                  <b className="ml-auto text-text shrink-0 text-[10px]">
                    {group.count.toLocaleString("en-IN")}
                  </b>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <StateSectionEmpty screen="scouting" />
      )}
    </div>
  );
}

type ScoutingWorkspaceProps = {
  dashboard: StateScoutingDashboard;
  initialProspects: StateScoutingProspect[];
  initialTotal: number;
  scopeTotal: number;
  defaultMinRating: number;
};

const meta = statePageMeta.scouting;
const PAGE_SIZE = 100;

const SPORT_OPTIONS = [
  { value: "all", label: "Sport: All" },
  ...HARYANA_FEATURED_SPORTS.map((s) => ({ value: s, label: `Sport: ${s}` })),
];

const DISTRICT_OPTIONS = [
  { value: "all", label: "District: All" },
  ...HARYANA_DISTRICTS.map((d) => ({ value: d, label: d })),
];

const AGE_OPTIONS = [
  { value: "all", label: "Age: All" },
  { value: "Sub-junior", label: "Age: Sub-junior" },
  { value: "Junior", label: "Age: Junior" },
  { value: "Senior", label: "Age: Senior" },
];

const TABLE_HEADERS = ["", "Athlete", "Sport", "District", "Score", "Status"] as const;
const TABLE_COLUMN_WIDTHS = ["4%", "32%", "16%", "16%", "10%", "22%"] as const;
const TABLE_COLUMN_CLASS_NAMES = [
  "w-[4%] min-w-0 pl-0",
  "min-w-0 pl-0",
  "min-w-0",
  "min-w-0",
  "min-w-0",
  "min-w-0",
] as const;

export function ScoutingWorkspace({
  dashboard,
  initialProspects,
  initialTotal,
  scopeTotal,
  defaultMinRating,
}: ScoutingWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useStatePageSearch();

  const [items, setItems] = useState(initialProspects);
  const [total, setTotal] = useState(initialTotal);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, ScoutingStatus | null | undefined>
  >({});
  const [sportFilter, setSportFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minRating, setMinRating] = useState(defaultMinRating);
  const [kheloReadyOnly, setKheloReadyOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>(SCOUTING_STATUS_OPTIONS[0]!.value);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState<ReportFormat>("xlsx");
  const [reportDownloading, setReportDownloading] = useState(false);
  const shortlistRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const fetchGenerationRef = useRef(0);
  const skipInitialRefetchRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);
  const prevFilterSnapshotRef = useRef({
    sportFilter,
    districtFilter,
    ageFilter,
    minRating,
    statusFilter,
    kheloReadyOnly,
    searchQuery,
  });

  const displayProspects = useMemo(
    () =>
      items.map((p) =>
        p.playerId in statusOverrides
          ? { ...p, scoutingStatus: statusOverrides[p.playerId] ?? null }
          : p
      ),
    [items, statusOverrides]
  );

  const listIds = useMemo(() => displayProspects.map((p) => p.playerId), [displayProspects]);
  const allListSelected = listIds.length > 0 && listIds.every((id) => selectedIds.has(id));

  const hasAnyData = scopeTotal > 0;
  const hasMore = items.length < total;
  const hasIdentified = dashboard.prospectsIdentified > 0;
  const hasPipeline = dashboard.pipeline.length > 0;

  const effectiveStatusFilter = kheloReadyOnly ? "khelo_india" : statusFilter;

  const listParams = useCallback(
    () => ({
      sport: sportFilter,
      district: districtFilter,
      ageGroup: ageFilter,
      minRating,
      status: effectiveStatusFilter,
      search: searchQuery,
      limit: PAGE_SIZE,
    }),
    [sportFilter, districtFilter, ageFilter, minRating, effectiveStatusFilter, searchQuery]
  );

  const listParamsRef = useRef(listParams);
  listParamsRef.current = listParams;

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
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
      const result = await api.state.scouting.listProspects({
        ...listParamsRef.current(),
        offset,
      });
      if (requestGeneration !== fetchGenerationRef.current) return;

      setTotal(result.total);
      setItems((current) => {
        if (!append) return result.items;
        const seen = new Set(current.map((item) => item.playerId));
        const next = result.items.filter((item) => !seen.has(item.playerId));
        return [...current, ...next];
      });
    } catch (err) {
      if (requestGeneration !== fetchGenerationRef.current) return;

      const message = err instanceof Error ? err.message : "Failed to load prospects.";
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
  }, []);

  useEffect(() => {
    if (skipInitialRefetchRef.current) {
      skipInitialRefetchRef.current = false;
      prevFilterSnapshotRef.current = {
        sportFilter,
        districtFilter,
        ageFilter,
        minRating,
        statusFilter,
        kheloReadyOnly,
        searchQuery,
      };
      return;
    }

    const prev = prevFilterSnapshotRef.current;
    const filtersChanged =
      prev.sportFilter !== sportFilter ||
      prev.districtFilter !== districtFilter ||
      prev.ageFilter !== ageFilter ||
      prev.minRating !== minRating ||
      prev.statusFilter !== statusFilter ||
      prev.kheloReadyOnly !== kheloReadyOnly;
    const searchChanged = prev.searchQuery !== searchQuery;

    prevFilterSnapshotRef.current = {
      sportFilter,
      districtFilter,
      ageFilter,
      minRating,
      statusFilter,
      kheloReadyOnly,
      searchQuery,
    };

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
    sportFilter,
    districtFilter,
    ageFilter,
    minRating,
    statusFilter,
    kheloReadyOnly,
    searchQuery,
    fetchPage,
  ]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    void fetchPage(items.length, true);
  }, [fetchPage, hasMore, items.length, loading, loadingMore]);

  const loadMoreFooter = hasMore ? (
    <StateLoadMoreFooter
      loaded={items.length}
      total={total}
      entityLabel="prospects"
      loading={loadingMore}
      disabled={loading || loadingMore}
      scrollRootRef={tableScrollRef}
      onLoadMore={handleLoadMore}
    />
  ) : undefined;

  const loadMoreFooterMobile = hasMore ? (
    <StateLoadMoreFooter
      loaded={items.length}
      total={total}
      entityLabel="prospects"
      loading={loadingMore}
      disabled={loading || loadingMore}
      scrollRootRef={cardScrollRef}
      onLoadMore={handleLoadMore}
    />
  ) : undefined;

  const subtitle =
    total > 0
      ? `Showing ${items.length.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} prospects`
      : hasIdentified
        ? `${dashboard.prospectsIdentified.toLocaleString("en-IN")} prospects identified statewide`
        : hasAnyData
          ? `${scopeTotal.toLocaleString("en-IN")} athletes available for scouting`
          : "Scouting shortlists populate from live athlete performance across Haryana";

  const toggleKheloReady = useCallback(() => {
    setKheloReadyOnly((prev) => {
      const next = !prev;
      if (next) setStatusFilter("khelo_india");
      else if (statusFilter === "khelo_india") setStatusFilter("all");
      return next;
    });
  }, [statusFilter]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allListSelected) {
        const next = new Set(prev);
        for (const id of listIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of listIds) next.add(id);
      return next;
    });
  }, [allListSelected, listIds]);

  const toggleSelect = useCallback((playerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (playerId: string, value: string) => {
      setError(null);
      setRowSavingId(playerId);
      const status = value === "" ? null : (value as ScoutingStatus);

      setStatusOverrides((prev) => ({ ...prev, [playerId]: status }));

      try {
        await api.state.scouting.updateStatus(playerId, status);
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
        router.refresh();
      } catch (err) {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
        setError(err instanceof Error ? err.message : "Failed to update status.");
      } finally {
        setRowSavingId(null);
      }
    },
    [router]
  );

  const handleBulkApply = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setError(null);
    setBulkSaving(true);
    const ids = [...selectedIds];
    const status = bulkStatus as ScoutingStatus;

    const overrides: Record<string, ScoutingStatus> = {};
    for (const id of ids) overrides[id] = status;
    setStatusOverrides((prev) => ({ ...prev, ...overrides }));

    try {
      await api.state.scouting.bulkUpdateStatus(ids, status);
      setStatusOverrides((prev) => {
        const next = { ...prev };
        for (const id of ids) delete next[id];
        return next;
      });
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        for (const id of ids) delete next[id];
        return next;
      });
      setError(err instanceof Error ? err.message : "Bulk update failed.");
    } finally {
      setBulkSaving(false);
    }
  }, [selectedIds, bulkStatus, router]);

  const openShortlistMenu = useCallback(() => {
    setShortlistOpen(true);
  }, []);

  const handleDownloadReport = useCallback(async () => {
    setError(null);
    setReportDownloading(true);
    try {
      const { blob, filename } = await api.state.scouting.downloadShortlistReport(reportFormat);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setShortlistOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report download failed.");
    } finally {
      setReportDownloading(false);
    }
  }, [reportFormat]);

  const runShortlistAction = (
    <div className="relative w-full sm:w-auto shrink-0" ref={shortlistRef}>
      <button
        type="button"
        onClick={openShortlistMenu}
        disabled={dashboard.shortlistReportCount === 0}
        title={
          dashboard.shortlistReportCount === 0
            ? "Mark athletes as Khelo India or shortlisted to generate a report"
            : undefined
        }
        className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[8px] px-4 rounded-[10px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UpIcon />
        {meta.actionLabel}
      </button>
      <ReportFormatPopover
        open={shortlistOpen}
        anchorRef={shortlistRef}
        format={reportFormat}
        onFormatChange={setReportFormat}
        onDownload={handleDownloadReport}
        downloading={reportDownloading}
        onClose={() => setShortlistOpen(false)}
        error={shortlistOpen ? error : null}
      />
    </div>
  );

  if (!hasAnyData) {
    return (
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <PageHeader title={meta.title} subtitle={subtitle} />
        </div>
        <StateSectionEmpty screen="scouting-prospects" />
      </div>
    );
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,248px)] gap-2 mb-2 items-stretch min-w-0">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-[22px] font-bold text-ink tracking-[-0.3px]">
                  {meta.title}
                </h1>
                <p className="text-[13px] text-muted mt-[3px]">{subtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start w-full xl:w-auto min-w-0 shrink-0">
                
                <button
                    type="button"
                    onClick={toggleKheloReady}
                    className={`shrink-0 inline-flex items-center min-h-[36px] w-full sm:w-auto px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition-colors ${
                      kheloReadyOnly
                        ? "bg-brand-soft text-brand-d border-brand/30"
                        : "bg-card border-line text-muted"
                    }`}
                  >
                    Khelo India ready
                  </button>
                  {runShortlistAction}
              </div>
            </div>
            

            {error && (
              <div className="text-[13px] text-[#D63B3B] bg-red-soft border border-[#F5C2C2] rounded-[10px] px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 min-w-0">
              <FilterPills>
                <InlineSelect
                  value={sportFilter}
                  options={SPORT_OPTIONS}
                  onChange={setSportFilter}
                  variant="pill"
                  filterPill
                  className="shrink-0"
                />
                <InlineSelect
                  value={ageFilter}
                  options={AGE_OPTIONS}
                  onChange={setAgeFilter}
                  variant="pill"
                  filterPill
                  className="shrink-0"
                />
                <InlineSelect
                  value={districtFilter}
                  options={DISTRICT_OPTIONS}
                  onChange={setDistrictFilter}
                  variant="pill"
                  filterPill
                  className="shrink-0"
                />
                <RatingFilterSlider value={minRating} onChange={setMinRating} />
                <InlineSelect
                  value={statusFilter}
                  options={SCOUTING_STATUS_FILTER_OPTIONS}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setKheloReadyOnly(value === "khelo_india");
                  }}
                  variant="pill"
                  filterPill
                  active={statusFilter !== "all"}
                  className="shrink-0"
                />
                
              </FilterPills>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-surface border border-line rounded-[12px] min-w-0">
                <span className="text-[13px] font-semibold text-ink shrink-0">
                  {selectedIds.size} selected
                </span>
                <InlineSelect
                  value={bulkStatus}
                  options={SCOUTING_STATUS_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  onChange={setBulkStatus}
                  variant="pill"
                  className="shrink-0"
                  aria-label="Bulk scouting status"
                />
                <button
                  type="button"
                  onClick={handleBulkApply}
                  disabled={bulkSaving}
                  className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[9px] px-3.5 rounded-[10px] disabled:opacity-60 min-h-[44px]"
                >
                  {bulkSaving ? "Applying…" : "Apply to selected"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[13px] font-medium text-muted min-h-[44px] px-2"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 min-w-0">
              <ScoutingStatTile
                value={dashboard.prospectsIdentified.toLocaleString("en-IN")}
                label="Prospects identified"
              />
              <ScoutingStatTile
                value={dashboard.shortlistedCount.toLocaleString("en-IN")}
                label="Shortlisted · Khelo India"
                valueColor={hasIdentified ? "#C77F12" : undefined}
              />
              <ScoutingStatTile
                value={dashboard.inCampsCount.toLocaleString("en-IN")}
                label="In state training camps"
              />
              <ScoutingStatTile
                value={hasIdentified ? `${dashboard.nationalCampRate}%` : "—"}
                label="Reached national camp"
                valueColor={hasIdentified ? "#0E9B72" : undefined}
              />
            </div>
          </div>

          <TalentPipelinePanel
            dashboard={dashboard}
            hasPipeline={hasPipeline}
            className="self-stretch"
          />
        </div>
      </div>

      <div className={`${stateLayout.listScrollRegion} overflow-hidden`}>
        <div className="min-w-0 min-h-0 flex flex-col flex-1 overflow-hidden">
          <ScrollableListPanel
            compactHeader
            className="flex-1 min-h-0"
            header={
              <div className="flex flex-col sm:flex-row items-center gap-2">
              <SectionTitle
                title="Top prospects this quarter"
              />
              <p className="text-[13px] text-muted">ranked by KhelSetu score</p>
              </div>
            }
          >
            {listError && displayProspects.length === 0 ? (
              <StateFilteredEmpty entity="prospects" description={listError} />
            ) : displayProspects.length === 0 && !loading ? (
              <StateFilteredEmpty
                entity="prospects"
                description="Try changing filters or your search term."
              />
            ) : (
              <div className="relative flex flex-col min-h-0 flex-1">
                <div
                  className={`flex flex-col min-h-0 flex-1 transition-opacity ${
                    loading && displayProspects.length > 0 ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <AcademyCardList
                    scrollable
                    scrollContainerRef={cardScrollRef}
                    footer={loadMoreFooterMobile}
                    className="flex-1 border-0 shadow-none rounded-none"
                  >
                    {displayProspects.map((p) => (
                      <AcademyCardListItem key={p.playerId}>
                        <div className="flex items-start gap-3 p-4 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.playerId)}
                            onChange={() => toggleSelect(p.playerId)}
                            aria-label={`Select ${p.name}`}
                            className="w-4 h-4 accent-brand mt-1 shrink-0"
                          />
                          <Avatar initials={p.initials} color={p.color} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px] text-ink truncate">
                              {p.name}
                            </div>
                            <div className="text-[11.5px] text-muted truncate">
                              {formatSportWeightLine(p.detail)}
                            </div>
                            <div className="text-[11.5px] text-muted mt-1 truncate">
                              {p.sport} · {p.district}
                            </div>
                            <div className="text-[12px] font-semibold text-[#0E9B72] mt-1">
                              Score {p.score}
                            </div>
                            <div className="mt-2 min-w-0">
                              <InlineSelect
                                value={p.scoutingStatus ?? ""}
                                options={SCOUTING_STATUS_SELECT_OPTIONS}
                                onChange={(value) => handleStatusChange(p.playerId, value)}
                                variant="pill"
                                className="w-full max-w-full min-w-0"
                                aria-label={`Status for ${p.name}`}
                                disabled={rowSavingId === p.playerId}
                              />
                            </div>
                          </div>
                        </div>
                      </AcademyCardListItem>
                    ))}
                  </AcademyCardList>

                  <AcademyTable
                    scrollable
                    scrollContainerRef={tableScrollRef}
                    footer={loadMoreFooter}
                    className="hidden lg:flex flex-1 border-0 shadow-none rounded-none"
                    headers={[...TABLE_HEADERS]}
                    columnWidths={[...TABLE_COLUMN_WIDTHS]}
                    columnClassNames={[...TABLE_COLUMN_CLASS_NAMES]}
                  >
                    {displayProspects.map((p) => (
                      <TableRow key={p.playerId}>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[0]}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.playerId)}
                            onChange={() => toggleSelect(p.playerId)}
                            aria-label={`Select ${p.name}`}
                            className="w-4 h-4 accent-brand"
                          />
                        </TableCell>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[1]}>
                          <div className="flex items-center gap-[11px] min-w-0">
                            <Avatar initials={p.initials} color={p.color} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[13px] text-ink truncate">
                                {p.name}
                              </div>
                              <div className="text-[11.5px] text-muted truncate">
                                {formatSportWeightLine(p.detail)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[2]}>
                          <span className="block truncate">{p.sport}</span>
                        </TableCell>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[3]}>
                          <span className="block truncate">{p.district}</span>
                        </TableCell>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[4]}>
                          <b className="text-[#0E9B72]">{p.score}</b>
                        </TableCell>
                        <TableCell className={TABLE_COLUMN_CLASS_NAMES[5]}>
                          {rowSavingId === p.playerId ? (
                            <span className="text-[12px] text-muted">Saving…</span>
                          ) : (
                            <InlineSelect
                              value={p.scoutingStatus ?? ""}
                              options={SCOUTING_STATUS_SELECT_OPTIONS}
                              onChange={(value) => handleStatusChange(p.playerId, value)}
                              variant="pill"
                              className="w-full max-w-full min-w-0"
                              aria-label={`Status for ${p.name}`}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </AcademyTable>
                </div>

                {loading && displayProspects.length > 0 ? (
                  <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-3 pointer-events-none">
                    <span className="text-[12px] font-medium text-muted bg-card/95 border border-line rounded-full px-3 py-1 shadow-sm">
                      Updating list…
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </ScrollableListPanel>
        </div>
      </div>
    </div>
  );
}
