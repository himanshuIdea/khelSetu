"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  parseAthleteRating,
  RatingFilterSlider,
} from "@/components/state/RatingFilterSlider";
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
import { matchesStateTextSearch } from "@/lib/state-search";
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
  prospects: StateScoutingProspect[];
};

const meta = statePageMeta.scouting;

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

const DEFAULT_MIN_RATING = 8;

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

function matchesScoutingSearch(prospect: StateScoutingProspect, query: string): boolean {
  return matchesStateTextSearch(query, [
    prospect.name,
    prospect.sport,
    prospect.district,
    prospect.nurseryName,
  ]);
}

export function ScoutingWorkspace({ dashboard, prospects }: ScoutingWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useStatePageSearch();

  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, ScoutingStatus | null | undefined>
  >({});
  const [sportFilter, setSportFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);
  const [kheloReadyOnly, setKheloReadyOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>(SCOUTING_STATUS_OPTIONS[0]!.value);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState<ReportFormat>("xlsx");
  const [reportDownloading, setReportDownloading] = useState(false);
  const shortlistRef = useRef<HTMLDivElement>(null);

  const displayProspects = useMemo(
    () =>
      prospects.map((p) =>
        p.playerId in statusOverrides
          ? { ...p, scoutingStatus: statusOverrides[p.playerId] ?? null }
          : p
      ),
    [prospects, statusOverrides]
  );

  const filtered = useMemo(() => {
    return displayProspects.filter((p) => {
      if (!matchesScoutingSearch(p, searchQuery)) return false;
      if (districtFilter !== "all" && p.district !== districtFilter) return false;
      if (sportFilter !== "all" && p.sportName !== sportFilter) return false;
      if (ageFilter !== "all" && p.batchName !== ageFilter) return false;

      const rating = parseAthleteRating(p.score);
      if (rating != null && rating < minRating) return false;

      if (kheloReadyOnly && p.scoutingStatus !== "khelo_india") return false;

      if (statusFilter === "unmarked" && p.scoutingStatus != null) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "unmarked" &&
        p.scoutingStatus !== statusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    displayProspects,
    searchQuery,
    districtFilter,
    sportFilter,
    ageFilter,
    minRating,
    kheloReadyOnly,
    statusFilter,
  ]);

  const filteredIds = useMemo(() => filtered.map((p) => p.playerId), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const hasAnyData = prospects.length > 0;
  const hasIdentified = dashboard.prospectsIdentified > 0;
  const hasPipeline = dashboard.pipeline.length > 0;

  const subtitle = hasIdentified
    ? `${dashboard.prospectsIdentified.toLocaleString("en-IN")} prospects identified statewide`
    : hasAnyData
      ? `${prospects.length.toLocaleString("en-IN")} athletes available for scouting`
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
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const id of filteredIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of filteredIds) next.add(id);
      return next;
    });
  }, [allFilteredSelected, filteredIds]);

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
            {filtered.length === 0 ? (
              <StateFilteredEmpty
                entity="prospects"
                description="Try changing filters or your search term."
              />
            ) : (
              <>
                <AcademyCardList scrollable className="flex-1 border-0 shadow-none rounded-none">
                  {filtered.map((p) => (
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
                  className="hidden lg:flex flex-1 border-0 shadow-none rounded-none"
                  headers={[...TABLE_HEADERS]}
                  columnWidths={[...TABLE_COLUMN_WIDTHS]}
                  columnClassNames={[...TABLE_COLUMN_CLASS_NAMES]}
                >
                  {filtered.map((p) => (
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
              </>
            )}
          </ScrollableListPanel>
        </div>
      </div>
    </div>
  );
}
