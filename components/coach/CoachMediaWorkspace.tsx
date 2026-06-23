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
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { api, ApiError } from "@/lib/api";
import { coachRoutes } from "@/lib/coach-nav";
import type {
  AcademyPublishedMediaItem,
  CoachMediaFilterOptions,
  CoachMediaSubmission,
  CoachMediaTab,
} from "@/lib/repositories/coach-media";

type CoachMediaWorkspaceProps = {
  academyId: string;
  submissions: CoachMediaSubmission[];
  publishedMedia: AcademyPublishedMediaItem[];
  filterOptions: CoachMediaFilterOptions;
  pendingCount: number;
  myPostCount: number;
};

type DateFilter = "all" | "7d" | "30d";
type MediaTypeFilter = "all" | "player_submission" | "coach_post";

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

function matchesDateFilter(isoDate: string, dateFilter: DateFilter): boolean {
  if (dateFilter === "all") {
    return true;
  }
  const submitted = new Date(isoDate).getTime();
  const days = dateFilter === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return submitted >= cutoff;
}

function AccordionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={`shrink-0 flex items-center justify-center w-9 h-9 text-muted transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function CoachMediaWorkspace({
  academyId,
  submissions,
  publishedMedia,
  filterOptions,
  pendingCount,
  myPostCount,
}: CoachMediaWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = parseTab(searchParams.get("tab"));
  const [sportId, setSportId] = useState(searchParams.get("sport") ?? "all");
  const [batchId, setBatchId] = useState(searchParams.get("batch") ?? "all");
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    (searchParams.get("date") as DateFilter) ?? "all"
  );
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>(
    (searchParams.get("type") as MediaTypeFilter) ?? "all"
  );
  const [playerQuery, setPlayerQuery] = useState(searchParams.get("player") ?? "");
  const [drillQuery, setDrillQuery] = useState(searchParams.get("drill") ?? "");
  const [unverifyError, setUnverifyError] = useState<string | null>(null);
  const [unverifyLoadingId, setUnverifyLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const syncParams = useCallback(
    (next: {
      tab?: CoachMediaTab;
      sport?: string;
      batch?: string;
      date?: DateFilter;
      type?: MediaTypeFilter;
      player?: string;
      drill?: string;
    }) => {
      const params = new URLSearchParams();
      const resolvedTab = next.tab ?? tab;
      const resolvedSport = next.sport ?? sportId;
      const resolvedBatch = next.batch ?? batchId;
      const resolvedDate = next.date ?? dateFilter;
      const resolvedType = next.type ?? typeFilter;
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
      if (resolvedTab === "academy-media" && resolvedType !== "all") {
        params.set("type", resolvedType);
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
    [batchId, dateFilter, drillQuery, playerQuery, router, sportId, tab, typeFilter]
  );

  const setTab = (nextTab: CoachMediaTab) => {
    syncParams({ tab: nextTab });
  };

  const sportOptions = useMemo(
    () => [
      { value: "all", label: "All sports" },
      ...filterOptions.sports.map((s) => ({ value: s.id, label: s.name })),
    ],
    [filterOptions.sports]
  );

  const batchOptions = useMemo(() => {
    const batches =
      sportId === "all"
        ? filterOptions.batches
        : filterOptions.batches.filter((batch) => batch.sportId === sportId);
    return [
      { value: "all", label: "All batches" },
      ...batches.map((b) => ({ value: b.id, label: b.name })),
    ];
  }, [filterOptions.batches, sportId]);

  const tabCounts = useMemo(
    () => ({
      "to-review": submissions.filter((s) => s.status === "pending").length,
      "academy-media": publishedMedia.length,
      reviewed: submissions.filter((s) => s.status === "reviewed").length,
    }),
    [publishedMedia.length, submissions]
  );

  const filteredSubmissions = useMemo(() => {
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
  }, [batchId, dateFilter, drillQuery, playerQuery, sportId, submissions, tab]);

  const filteredPublished = useMemo(() => {
    return publishedMedia.filter((item) => {
      if (sportId !== "all" && item.sportId !== sportId) {
        return false;
      }
      if (batchId !== "all" && item.batchId !== batchId) {
        return false;
      }
      if (!matchesDateFilter(item.publishedAt, dateFilter)) {
        return false;
      }
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }
      if (playerQuery.trim() && item.authorKind === "player") {
        const q = playerQuery.trim().toLowerCase();
        if (!item.authorName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (drillQuery.trim()) {
        const q = drillQuery.trim().toLowerCase();
        if (!item.drillName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [batchId, dateFilter, drillQuery, playerQuery, publishedMedia, sportId, typeFilter]);

  function toggleExpanded(key: string) {
    setExpandedId((current) => (current === key ? null : key));
  }

  async function handleUnverify(item: AcademyPublishedMediaItem) {
    const key = `${item.type}:${item.sourceId}`;
    setUnverifyLoadingId(key);
    setUnverifyError(null);
    try {
      if (item.type === "player_submission") {
        await api.coach.media.setSubmissionPublished(academyId, item.sourceId, false);
      } else {
        await api.coach.media.setDrillPostPublished(academyId, item.sourceId, false);
      }
      router.refresh();
    } catch (err) {
      setUnverifyError(err instanceof ApiError ? err.message : "Could not remove from academy.");
    } finally {
      setUnverifyLoadingId(null);
    }
  }

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
            title: "No published media",
            description: "Verified player clips and published coach drills appear here.",
          };

  const listEmpty =
    tab === "academy-media" ? filteredPublished.length === 0 : filteredSubmissions.length === 0;

  return (
    <PageBody>
      <PageHeader
        title="Media"
        subtitle={`${pendingCount} player submission${pendingCount === 1 ? "" : "s"} awaiting your review.`}
      />

      <Link
        href={coachRoutes.mySubmissions}
        className="flex items-center gap-3 mb-5 p-4 border border-line rounded-xl bg-card shadow-card min-w-0 min-h-[44px] hover:border-brand/30 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-soft)" }}
        >
          <VideoIcon className="w-4 h-4 text-[var(--brand-d)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13.5px] text-ink">My drill videos</div>
          <div className="text-[12px] text-muted truncate">
            {myPostCount === 0
              ? "View and manage videos you've posted"
              : `${myPostCount} video${myPostCount === 1 ? "" : "s"} posted by you`}
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4 h-4 text-muted shrink-0"
          aria-hidden="true"
        >
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </Link>

      <div className="mb-4 lg:hidden" role="tablist" aria-label="Media sections">
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-line rounded-[12px]">
          {(Object.keys(TAB_LABELS) as CoachMediaTab[]).map((tabId) => {
            const isActive = tab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tabId)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-1 py-2 rounded-[10px] transition-colors ${
                  isActive
                    ? "bg-card border border-line shadow-card text-brand-d"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`text-[15px] font-bold leading-none ${isActive ? "text-brand-d" : "text-ink"}`}
                >
                  {tabCounts[tabId]}
                </span>
                <span className="text-[10.5px] font-semibold leading-tight text-center line-clamp-2">
                  {TAB_LABELS[tabId]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block mb-5">
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
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(value) => {
                const next = value as MediaTypeFilter;
                setTypeFilter(next);
                syncParams({ type: next });
              }}
              active={typeFilter !== "all"}
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={[
                { value: "all", label: "All types" },
                { value: "player_submission", label: "Player" },
                { value: "coach_post", label: "Coach drill" },
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

        {unverifyError ? (
          <p className="text-[12px] text-red-600 font-medium mb-3" role="alert">
            {unverifyError}
          </p>
        ) : null}

        {listEmpty ? (
          <EmptyState
            compact
            icon={<VideoIcon className="w-5 h-5" />}
            title={emptyCopy.title}
            description={emptyCopy.description}
          />
        ) : tab === "academy-media" ? (
          <div className="flex flex-col gap-[11px] min-w-0">
            {filteredPublished.map((item) => {
              const key = `${item.type}:${item.sourceId}`;
              const isExpanded = expandedId === key;
              const reviewHref =
                item.type === "player_submission"
                  ? `${coachRoutes.media}/${item.sourceId}`
                  : null;

              return (
                <div
                  key={key}
                  className="border border-line rounded-xl bg-card shadow-card min-w-0 overflow-hidden"
                >
                  <div className="flex gap-[11px] items-center p-[11px] min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(key)}
                      className="flex gap-[11px] items-center flex-1 min-w-0 min-h-[44px] text-left"
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded ? `Collapse video for ${item.drillName}` : `Expand video for ${item.drillName}`
                      }
                    >
                      <div
                        className="w-[46px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: item.thumbnailGradient }}
                      >
                        <VideoIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[12.5px] text-text truncate">
                          {item.drillName}
                        </div>
                        <div className="text-[11.5px] text-muted truncate">
                          {item.authorName} · {item.sportName}
                          {item.batchName ? ` · ${item.batchName}` : ""} · {item.timeAgo}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Pill variant="green">Verified</Pill>
                        <Pill variant={item.authorKind === "coach" ? "blue" : "grey"}>
                          {item.authorKind === "coach" ? "Coach" : "Player"}
                        </Pill>
                      </div>
                      <AccordionChevron expanded={isExpanded} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleUnverify(item);
                      }}
                      disabled={unverifyLoadingId === key}
                      className="shrink-0 min-h-[44px] px-3 rounded-[10px] border border-line text-[12px] font-semibold text-red-600 disabled:opacity-60"
                    >
                      {unverifyLoadingId === key ? "…" : "Remove"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="px-[11px] pb-[11px] min-w-0 border-t border-line pt-3">
                      <InlineVideoPlayer
                        src={item.videoUrl}
                        posterGradient={item.thumbnailGradient}
                        durationSeconds={item.durationSeconds}
                        tag={item.sportName}
                        variant="review"
                        objectFit="contain"
                        ariaLabel={`Play ${item.drillName}`}
                      />
                      {item.subtitle ? (
                        <p className="text-[12.5px] text-muted leading-relaxed mt-3">
                          {item.subtitle}
                        </p>
                      ) : null}
                      {reviewHref ? (
                        <Link
                          href={reviewHref}
                          className="inline-flex items-center min-h-[44px] mt-2 text-[13px] font-semibold text-brand"
                        >
                          Open full review →
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-[11px] min-w-0">
            {filteredSubmissions.map((submission) => (
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
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Pill variant={submission.status === "pending" ? "amber" : "green"}>
                    {submission.status === "pending" ? "Pending" : "Reviewed"}
                  </Pill>
                  {submission.isPublished ? <Pill variant="green">Live</Pill> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageBody>
  );
}
