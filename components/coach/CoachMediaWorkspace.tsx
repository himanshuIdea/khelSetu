"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { VideoIcon } from "@/components/academy/icons";
import {
  EmptyState,
  FilterPills,
  PageBody,
  PageHeader,
  Pill,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import { coachRoutes } from "@/lib/coach-nav";
import type {
  CoachMediaFilterOptions,
  CoachMediaSubmission,
  CoachMediaTab,
} from "@/lib/repositories/coach-media";

type CoachMediaWorkspaceProps = {
  submissions: CoachMediaSubmission[];
  filterOptions: CoachMediaFilterOptions;
  pendingCount: number;
};

type DateFilter = "all" | "7d" | "30d";
type StatusFilter = "all" | "pending" | "reviewed";

const TAB_LABELS: Record<CoachMediaTab, string> = {
  "to-review": "To review",
  "academy-media": "Academy media",
  reviewed: "Reviewed",
};

function parseTab(value: string | null): CoachMediaTab {
  if (value === "academy-media" || value === "reviewed") {
    return value;
  }
  return "to-review";
}

function matchesDateFilter(submittedAt: string, dateFilter: DateFilter): boolean {
  if (dateFilter === "all") {
    return true;
  }
  const submitted = new Date(submittedAt).getTime();
  const days = dateFilter === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return submitted >= cutoff;
}

export function CoachMediaWorkspace({
  submissions,
  filterOptions,
  pendingCount,
}: CoachMediaWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = parseTab(searchParams.get("tab"));
  const [sportId, setSportId] = useState(searchParams.get("sport") ?? "all");
  const [batchId, setBatchId] = useState(searchParams.get("batch") ?? "all");
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    (searchParams.get("date") as DateFilter) ?? "all"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) ?? "all"
  );
  const [playerQuery, setPlayerQuery] = useState(searchParams.get("player") ?? "");
  const [drillQuery, setDrillQuery] = useState(searchParams.get("drill") ?? "");

  const syncParams = useCallback(
    (next: {
      tab?: CoachMediaTab;
      sport?: string;
      batch?: string;
      date?: DateFilter;
      status?: StatusFilter;
      player?: string;
      drill?: string;
    }) => {
      const params = new URLSearchParams();
      const resolvedTab = next.tab ?? tab;
      const resolvedSport = next.sport ?? sportId;
      const resolvedBatch = next.batch ?? batchId;
      const resolvedDate = next.date ?? dateFilter;
      const resolvedStatus = next.status ?? statusFilter;
      const resolvedPlayer = next.player ?? playerQuery;
      const resolvedDrill = next.drill ?? drillQuery;

      if (resolvedTab !== "to-review") {
        params.set("tab", resolvedTab);
      }
      if (resolvedSport !== "all") {
        params.set("sport", resolvedSport);
      }
      if (resolvedBatch !== "all") {
        params.set("batch", resolvedBatch);
      }
      if (resolvedDate !== "all") {
        params.set("date", resolvedDate);
      }
      if (resolvedTab === "academy-media" && resolvedStatus !== "all") {
        params.set("status", resolvedStatus);
      }
      if (resolvedPlayer.trim()) {
        params.set("player", resolvedPlayer.trim());
      }
      if (resolvedDrill.trim()) {
        params.set("drill", resolvedDrill.trim());
      }

      const query = params.toString();
      router.replace(query ? `${coachRoutes.media}?${query}` : coachRoutes.media, {
        scroll: false,
      });
    },
    [batchId, dateFilter, drillQuery, playerQuery, router, sportId, statusFilter, tab]
  );

  const setTab = (nextTab: CoachMediaTab) => {
    syncParams({ tab: nextTab });
  };

  const sportOptions = useMemo(
    () => [{ value: "all", label: "All sports" }, ...filterOptions.sports.map((s) => ({ value: s.id, label: s.name }))],
    [filterOptions.sports]
  );

  const batchOptions = useMemo(() => {
    const batches =
      sportId === "all"
        ? filterOptions.batches
        : filterOptions.batches.filter((batch) => batch.sportId === sportId);
    return [{ value: "all", label: "All batches" }, ...batches.map((b) => ({ value: b.id, label: b.name }))];
  }, [filterOptions.batches, sportId]);

  const tabCounts = useMemo(
    () => ({
      "to-review": submissions.filter((s) => s.status === "pending").length,
      "academy-media": submissions.length,
      reviewed: submissions.filter((s) => s.status === "reviewed").length,
    }),
    [submissions]
  );

  const filtered = useMemo(() => {
    return submissions.filter((submission) => {
      if (tab === "to-review" && submission.status !== "pending") {
        return false;
      }
      if (tab === "reviewed" && submission.status !== "reviewed") {
        return false;
      }
      if (sportId !== "all" && submission.sportId !== sportId) {
        return false;
      }
      if (batchId !== "all" && submission.batchId !== batchId) {
        return false;
      }
      if (!matchesDateFilter(submission.submittedAt, dateFilter)) {
        return false;
      }
      if (tab === "academy-media" && statusFilter !== "all" && submission.status !== statusFilter) {
        return false;
      }
      if (playerQuery.trim()) {
        const q = playerQuery.trim().toLowerCase();
        if (!submission.playerName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (drillQuery.trim()) {
        const q = drillQuery.trim().toLowerCase();
        if (!submission.drillName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [batchId, dateFilter, drillQuery, playerQuery, sportId, statusFilter, submissions, tab]);

  const emptyCopy =
    tab === "to-review"
      ? {
          title: "No submissions to review",
          description: "When players submit drill videos assigned to you, they'll appear here.",
        }
      : tab === "reviewed"
        ? {
            title: "No reviewed submissions",
            description: "Completed reviews will show up in this list.",
          }
        : {
            title: "No media matches filters",
            description: "Try changing sport, batch, date, or search filters.",
          };

  return (
    <PageBody>
      <PageHeader
        title="Media"
        subtitle={`${pendingCount} player submission${pendingCount === 1 ? "" : "s"} awaiting your review.`}
      />

      <div className="mb-5">
        <StatGrid>
          {(Object.keys(TAB_LABELS) as CoachMediaTab[]).map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className="text-left min-w-0"
          >
            <StatCard
              compact
              value={String(tabCounts[tabId])}
              label={TAB_LABELS[tabId]}
              valueColor={tab === tabId ? "var(--brand-d)" : undefined}
              icon={<VideoIcon className="w-5 h-5" />}
              iconBg={tab === tabId ? "var(--brand-soft)" : "var(--surface)"}
              iconColor={tab === tabId ? "var(--brand-d)" : "var(--muted)"}
            />
          </button>
        ))}
        </StatGrid>
      </div>

      <div className="min-w-0">
        <FilterPills>
          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by sport"
            value={sportId}
            onChange={(value) => {
              setSportId(value);
              setBatchId("all");
              syncParams({ sport: value, batch: "all" });
            }}
            active={sportId !== "all"}
            menuMaxHeightClass="max-h-52"
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={sportOptions}
          />
          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by batch"
            value={batchId}
            onChange={(value) => {
              setBatchId(value);
              syncParams({ batch: value });
            }}
            active={batchId !== "all"}
            menuMaxHeightClass="max-h-52"
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={batchOptions}
          />
          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by date"
            value={dateFilter}
            onChange={(value) => {
              const next = value as DateFilter;
              setDateFilter(next);
              syncParams({ date: next });
            }}
            active={dateFilter !== "all"}
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={[
              { value: "all", label: "All dates" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
          />
          {tab === "academy-media" && (
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(value) => {
                const next = value as StatusFilter;
                setStatusFilter(next);
                syncParams({ status: next });
              }}
              active={statusFilter !== "all"}
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={[
                { value: "all", label: "All status" },
                { value: "pending", label: "Pending" },
                { value: "reviewed", label: "Reviewed" },
              ]}
            />
          )}
        </FilterPills>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 min-w-0">
          <label className="min-w-0">
            <span className="sr-only">Search by player</span>
            <input
              type="search"
              value={playerQuery}
              onChange={(event) => {
                setPlayerQuery(event.target.value);
                syncParams({ player: event.target.value });
              }}
              placeholder="Search player…"
              className="w-full min-h-[44px] rounded-[10px] border border-line bg-card px-3 text-[13px] text-ink placeholder:text-muted2"
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">Search by drill</span>
            <input
              type="search"
              value={drillQuery}
              onChange={(event) => {
                setDrillQuery(event.target.value);
                syncParams({ drill: event.target.value });
              }}
              placeholder="Search drill…"
              className="w-full min-h-[44px] rounded-[10px] border border-line bg-card px-3 text-[13px] text-ink placeholder:text-muted2"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<VideoIcon className="w-5 h-5" />}
            title={emptyCopy.title}
            description={emptyCopy.description}
          />
        ) : (
          <div className="flex flex-col gap-[11px] min-w-0">
            {filtered.map((submission) => (
              <Link
                key={submission.id}
                href={`${coachRoutes.media}/${submission.id}`}
                className="flex gap-[11px] items-center p-[11px] border border-line rounded-xl bg-card shadow-card min-w-0 min-h-[44px] hover:border-brand/30 transition-colors"
              >
                <div
                  className="w-[46px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0"
                  style={{ background: submission.thumbnailGradient }}
                >
                  <VideoIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[12.5px] text-text truncate">
                    {submission.drillName}
                  </div>
                  <div className="text-[11.5px] text-muted truncate">
                    {submission.playerName} · {submission.sportName}
                    {submission.batchName ? ` · ${submission.batchName}` : ""} · {submission.timeAgo}
                  </div>
                </div>
                <Pill variant={submission.status === "pending" ? "amber" : "green"}>
                  {submission.status === "pending" ? "Pending" : "Reviewed"}
                </Pill>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageBody>
  );
}
