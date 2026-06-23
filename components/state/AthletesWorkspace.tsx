"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DotsIcon, UpIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty, StateListEmpty } from "@/components/state/StateEmptyStates";
import { StateLoadMoreFooter } from "@/components/state/StateLoadMoreFooter";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  RatingFilterSlider,
} from "@/components/state/RatingFilterSlider";
import {
  ReportFormatPopover,
  type ReportFormat,
} from "@/components/state/ReportFormatPopover";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import { api } from "@/lib/api";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { StateAthleteListItem } from "@/lib/state-portal";
import { formatSportWeightLine } from "@/lib/format";

type AthletesWorkspaceProps = {
  initialItems: StateAthleteListItem[];
  initialTotal: number;
  defaultMinRating: number;
};

const meta = statePageMeta.athletes;
const PAGE_SIZE = 100;

const DISTRICT_OPTIONS = [
  { value: "all", label: "District: All" },
  ...HARYANA_DISTRICTS.map((d) => ({ value: d, label: d })),
];

const SPORT_OPTIONS = [
  { value: "all", label: "All sports" },
  ...HARYANA_FEATURED_SPORTS.map((s) => ({ value: s, label: s })),
];

export function AthletesWorkspace({
  initialItems,
  initialTotal,
  defaultMinRating,
}: AthletesWorkspaceProps) {
  const searchQuery = useStatePageSearch();
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [minRating, setMinRating] = useState(defaultMinRating);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState<ReportFormat>("xlsx");
  const [reportDownloading, setReportDownloading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fetchGenerationRef = useRef(0);
  const skipInitialRefetchRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);
  const prevFilterSnapshotRef = useRef({
    sportFilter,
    districtFilter,
    minRating,
    searchQuery,
  });

  const hasAnyAthletes = initialTotal > 0 || total > 0;
  const hasMore = items.length < total;

  const listParams = useCallback(
    () => ({
      sport: sportFilter,
      district: districtFilter,
      minRating,
      search: searchQuery,
      limit: PAGE_SIZE,
    }),
    [sportFilter, districtFilter, minRating, searchQuery]
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
      const result = await api.state.athletes.list({ ...listParamsRef.current(), offset });
      if (requestGeneration !== fetchGenerationRef.current) return;

      setTotal(result.total);
      setItems((current) => {
        if (!append) return result.items;
        const seen = new Set(current.map((item) => item.id));
        const next = result.items.filter((item) => !seen.has(item.id));
        return [...current, ...next];
      });
    } catch (err) {
      if (requestGeneration !== fetchGenerationRef.current) return;

      const message = err instanceof Error ? err.message : "Failed to load athletes.";
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
        minRating,
        searchQuery,
      };
      return;
    }

    const prev = prevFilterSnapshotRef.current;
    const filtersChanged =
      prev.sportFilter !== sportFilter ||
      prev.districtFilter !== districtFilter ||
      prev.minRating !== minRating;
    const searchChanged = prev.searchQuery !== searchQuery;

    prevFilterSnapshotRef.current = {
      sportFilter,
      districtFilter,
      minRating,
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
  }, [sportFilter, districtFilter, minRating, searchQuery, fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    void fetchPage(items.length, true);
  }, [fetchPage, hasMore, items.length, loading, loadingMore]);

  const handleDownloadReport = useCallback(async () => {
    setExportError(null);
    setReportDownloading(true);
    try {
      const { blob, filename } = await api.state.athletes.downloadRosterReport({
        format: reportFormat,
        sport: sportFilter !== "all" ? sportFilter : undefined,
        district: districtFilter !== "all" ? districtFilter : undefined,
        minRating,
        search: searchQuery.trim() || undefined,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Report download failed.");
    } finally {
      setReportDownloading(false);
    }
  }, [reportFormat, sportFilter, districtFilter, minRating, searchQuery]);

  const subtitle =
    total > 0
      ? `Showing ${items.length.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} athletes`
      : hasAnyAthletes
        ? "100s of athletes tracked statewide"
        : "Registered athletes from verified nurseries will appear here";

  const exportAction = (
    <div className="relative w-full sm:w-auto shrink-0" ref={exportRef}>
      <button
        type="button"
        onClick={() => setExportOpen(true)}
        disabled={total === 0}
        title={total === 0 ? "No athletes match the current filters." : undefined}
        className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UpIcon />
        {meta.actionLabel}
      </button>
      <ReportFormatPopover
        open={exportOpen}
        anchorRef={exportRef}
        format={reportFormat}
        onFormatChange={setReportFormat}
        onDownload={handleDownloadReport}
        downloading={reportDownloading}
        onClose={() => setExportOpen(false)}
        error={exportOpen ? exportError : null}
        helperText={`Exports all ${total.toLocaleString("en-IN")} athletes matching current filters.`}
      />
    </div>
  );

  if (!hasAnyAthletes && items.length === 0 && !loading) {
    return (
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <PageHeader title={meta.title} subtitle={subtitle} action={exportAction} />
        </div>
        <StateListEmpty screen="athletes" />
      </div>
    );
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader title={meta.title} subtitle={subtitle} action={exportAction} />

        <div className="flex flex-wrap gap-2 mb-3.5 min-w-0">
          <FilterPills>
            <InlineSelect
              value={sportFilter}
              options={SPORT_OPTIONS}
              onChange={setSportFilter}
              variant="pill"
              className="shrink-0"
            />
            <InlineSelect
              value={districtFilter}
              options={DISTRICT_OPTIONS}
              onChange={setDistrictFilter}
              variant="pill"
              className="shrink-0"
            />
            <RatingFilterSlider value={minRating} onChange={setMinRating} />
          </FilterPills>
        </div>
      </div>

      <div className={stateLayout.listScrollRegion}>
        {listError && items.length === 0 ? (
          <StateFilteredEmpty entity="athletes" description={listError} />
        ) : items.length === 0 && !loading ? (
          <StateFilteredEmpty
            entity="athletes"
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
                headers={["Athlete", "Sport · Batch", "District", "KhelSetu score", ""]}
                columnWidths={["34%", "28%", "16%", "14%", "8%"]}
                className="flex-1"
                footer={
                  hasMore ? (
                    <StateLoadMoreFooter
                      loaded={items.length}
                      total={total}
                      entityLabel="athletes"
                      loading={loadingMore}
                      disabled={loading || loadingMore}
                      scrollRootRef={tableScrollRef}
                      onLoadMore={handleLoadMore}
                    />
                  ) : undefined
                }
              >
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="min-w-0">
                      <div className="flex items-center gap-[11px] min-w-0">
                        <Avatar initials={a.initials} color={a.color} />
                        <div className="min-w-0">
                          <div className="font-semibold text-[13px] text-ink truncate">{a.name}</div>
                          <div className="text-[11.5px] text-muted truncate">{a.detail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="truncate">{formatSportWeightLine(a.sport)}</div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="truncate">{a.district}</div>
                    </TableCell>
                    <TableCell>
                      <b className="text-[#0E9B72]">{a.rating}</b>
                    </TableCell>
                    <TableCell>
                      <DotsIcon className="text-muted2" />
                    </TableCell>
                  </TableRow>
                ))}
              </AcademyTable>
            </div>

            {loading && items.length > 0 ? (
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-3 pointer-events-none">
                <span className="text-[12px] font-medium text-muted bg-card/95 border border-line rounded-full px-3 py-1 shadow-sm">
                  Updating…
                </span>
              </div>
            ) : null}

            {loading && items.length === 0 && (
              <p className="text-center text-[13px] text-muted py-6">Loading athletes…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
