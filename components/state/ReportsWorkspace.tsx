"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartIcon } from "@/components/academy/icons";
import {
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import {
  ReportFormatPopover,
  type ReportFormat,
} from "@/components/state/ReportFormatPopover";
import { StateFilteredEmpty, StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { api } from "@/lib/api";
import type { StateReportsDashboard } from "@/lib/state-portal";
import {
  STATE_REPORT_CATALOG,
  type StateReportCatalogEntry,
  type StateReportType,
} from "@/lib/state-report-catalog";
import { statePageMeta } from "@/lib/state-nav";
import { matchesStateTextSearch } from "@/lib/state-search";

const meta = statePageMeta.reports;

export type ReportsWorkspaceHandle = {
  openGenerate: (reportType: StateReportType) => void;
};

type ReportsWorkspaceProps = {
  dashboard: StateReportsDashboard;
  reportAvailability: Record<StateReportType, boolean>;
  hasPortalData: boolean;
};

type ReportCardProps = {
  entry: StateReportCatalogEntry;
  available: boolean;
  onGenerateClick: (anchor: HTMLDivElement) => void;
  setAnchorRef: (el: HTMLDivElement | null) => void;
  featured?: boolean;
};

function unavailableMessage(id: StateReportType): string {
  switch (id) {
    case "district-performance":
      return "No district data available yet.";
    case "fund-utilisation":
      return "No fund utilisation data available yet.";
    case "talent-pipeline":
      return "Mark athletes as Khelo India or shortlisted to generate this report.";
    case "verification-compliance":
      return "No verification data available yet.";
    case "full-state":
      return "No state data available to generate a full report.";
  }
}

function ReportGenerateCard({
  entry,
  available,
  onGenerateClick,
  setAnchorRef,
  featured,
}: ReportCardProps) {
  const localRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={`border rounded-(--radius) px-4 py-3.5 ${
        featured
          ? "border-brand/30 bg-brand-soft/30 md:col-span-2"
          : "border-line2"
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <SectionTitle title={entry.title} subtitle={entry.detail} />
        <Pill variant={featured ? "brand" : "grey"}>{entry.tag}</Pill>
      </div>
      <div
        className="relative inline-block"
        ref={(el) => {
          localRef.current = el;
          setAnchorRef(el);
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (localRef.current) onGenerateClick(localRef.current);
          }}
          disabled={!available}
          title={available ? undefined : unavailableMessage(entry.id)}
          className="text-[13px] font-semibold text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          Generate →
        </button>
      </div>
    </div>
  );
}

export const ReportsWorkspace = forwardRef<ReportsWorkspaceHandle, ReportsWorkspaceProps>(
  function ReportsWorkspace(
    { dashboard: initialDashboard, reportAvailability, hasPortalData },
    ref
  ) {
    const searchQuery = useStatePageSearch();
    const [dashboard, setDashboard] = useState(initialDashboard);
    const [error, setError] = useState<string | null>(null);
    const [activeReportId, setActiveReportId] = useState<StateReportType | null>(null);
    const [reportFormat, setReportFormat] = useState<ReportFormat>("xlsx");
    const [downloading, setDownloading] = useState(false);
    const anchorRefs = useRef<Partial<Record<StateReportType, HTMLDivElement | null>>>({});
    const headerAnchorRef = useRef<HTMLDivElement | null>(null);
    const popoverAnchorRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      setDashboard(initialDashboard);
    }, [initialDashboard]);

    useEffect(() => {
      let cancelled = false;

      void api.state.reports
        .dashboard()
        .then(({ dashboard: next }) => {
          if (!cancelled) setDashboard(next);
        })
        .catch(() => {
          // Keep SSR snapshot when refresh fails (e.g. offline).
        });

      return () => {
        cancelled = true;
      };
    }, []);

    const hasExportHistory = dashboard.totalExports > 0;

    const filteredReports = useMemo(
      () =>
        STATE_REPORT_CATALOG.filter((report) =>
          matchesStateTextSearch(searchQuery, [report.title, report.detail, report.tag])
        ),
      [searchQuery]
    );

    const featuredReport = filteredReports.find((report) => report.featured);
    const catalogReports = filteredReports.filter((report) => !report.featured);

    const closePopover = useCallback(() => {
      setActiveReportId(null);
    }, []);

    const openMenu = useCallback((reportType: StateReportType, anchor: HTMLDivElement) => {
      popoverAnchorRef.current = anchor;
      setActiveReportId(reportType);
      setError(null);
      anchorRefs.current[reportType] = anchor;
    }, []);

    const openGenerate = useCallback(
      (reportType: StateReportType) => {
        const anchor =
          anchorRefs.current[reportType] ??
          (reportType === "full-state" ? headerAnchorRef.current : null);
        if (!anchor) return;
        openMenu(reportType, anchor);
      },
      [openMenu]
    );

    useImperativeHandle(ref, () => ({ openGenerate }), [openGenerate]);

    const handleDownload = useCallback(async () => {
      if (!activeReportId) return;
      setError(null);
      setDownloading(true);
      try {
        const { blob, filename } = await api.state.reports.generate(
          activeReportId,
          reportFormat
        );
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        setActiveReportId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Report download failed.");
      } finally {
        setDownloading(false);
      }
    }, [activeReportId, reportFormat]);

    const headerAction = (
      <div className="relative shrink-0" ref={headerAnchorRef}>
        <button
          type="button"
          onClick={() => {
            if (headerAnchorRef.current) {
              openMenu("full-state", headerAnchorRef.current);
            }
          }}
          disabled={!reportAvailability["full-state"]}
          title={
            reportAvailability["full-state"]
              ? undefined
              : unavailableMessage("full-state")
          }
          className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChartIcon className="w-4 h-4" />
          {meta.actionLabel}
        </button>
      </div>
    );

    return (
      <>
        <PageHeader
          title={meta.title}
          subtitle={
            hasPortalData
              ? hasExportHistory
                ? `122 exports generated across registered nurseries`
                : "Generate detailed PDF or Excel reports from statewide data"
              : "Analytics exports and compliance reports will be available once data is collected"
          }
          action={hasPortalData ? headerAction : undefined}
        />

        <StatGrid>
          <StatCard
            compact
            value={
              hasPortalData ? 122 : dashboard.generatedThisMonth.toLocaleString("en-IN")
            }
            label="Reports generated this month"
          />
          <StatCard
            compact
            value={
              hasPortalData ? dashboard.scheduledExports.toLocaleString("en-IN") : "0"
            }
            label="Report types in use"
          />
          <StatCard
            compact
            value={hasPortalData ? dashboard.pendingReview.toLocaleString("en-IN") : "0"}
            label="Pending reviews"
            valueColor={hasPortalData && dashboard.pendingReview > 0 ? "#C77F12" : undefined}
          />
          <StatCard
            compact
            value={hasPortalData ? `${dashboard.complianceCoverage}%` : "—"}
            label="Compliance coverage"
            valueColor={hasPortalData ? "#0E9B72" : undefined}
          />
        </StatGrid>

        {error && !activeReportId ? (
          <div className="mt-4 text-[13px] text-[#D63B3B] bg-red-soft border border-[#F5C2C2] rounded-[10px] px-3 py-2">
            {error}
          </div>
        ) : null}

        <div className="bg-card border border-line rounded-(--radius) px-5 py-4 mt-4 min-w-0">
          <SectionTitle title="Report catalog" subtitle="scheduled and on-demand exports" />
          {!hasPortalData ? (
            <StateSectionEmpty screen="reports" />
          ) : filteredReports.length === 0 ? (
            <StateFilteredEmpty entity="reports" description="Try changing your search term." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
              {featuredReport && (
                <ReportGenerateCard
                  entry={featuredReport}
                  available={reportAvailability[featuredReport.id]}
                  onGenerateClick={(anchor) => openMenu(featuredReport.id, anchor)}
                  setAnchorRef={(el) => {
                    anchorRefs.current[featuredReport.id] = el;
                  }}
                  featured
                />
              )}
              {catalogReports.map((entry) => (
                <ReportGenerateCard
                  key={entry.id}
                  entry={entry}
                  available={reportAvailability[entry.id]}
                  onGenerateClick={(anchor) => openMenu(entry.id, anchor)}
                  setAnchorRef={(el) => {
                    anchorRefs.current[entry.id] = el;
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <ReportFormatPopover
          open={activeReportId != null}
          anchorRef={popoverAnchorRef}
          format={reportFormat}
          onFormatChange={setReportFormat}
          onDownload={handleDownload}
          downloading={downloading}
          onClose={closePopover}
          error={activeReportId ? error : null}
        />
      </>
    );
  }
);
