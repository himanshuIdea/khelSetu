"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PlusIcon, VideoIcon } from "@/components/academy/icons";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  EmptyState,
  FilterPills,
  PageBody,
  Pill,
} from "@/components/academy/shared";
import { api, ApiError } from "@/lib/api";
import { coachRoutes } from "@/lib/coach-nav";
import type {
  CoachDrillPostItem,
  CoachMediaFilterOptions,
} from "@/lib/repositories/coach-media";

type CoachMySubmissionsWorkspaceProps = {
  academyId: string;
  posts: CoachDrillPostItem[];
  filterOptions: CoachMediaFilterOptions;
};

type DateFilter = "all" | "7d" | "30d";
type StatusFilter = "all" | "published" | "draft";

function parseStatus(value: string | null): StatusFilter {
  if (value === "published" || value === "draft") {
    return value;
  }
  return "all";
}

function matchesDateFilter(isoDate: string, dateFilter: DateFilter): boolean {
  if (dateFilter === "all") {
    return true;
  }
  const posted = new Date(isoDate).getTime();
  const days = dateFilter === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return posted >= cutoff;
}

export function CoachMySubmissionsWorkspace({
  academyId,
  posts,
  filterOptions,
}: CoachMySubmissionsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sportId, setSportId] = useState(searchParams.get("sport") ?? "all");
  const [batchId, setBatchId] = useState(searchParams.get("batch") ?? "all");
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    (searchParams.get("date") as DateFilter) ?? "all"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    parseStatus(searchParams.get("status"))
  );
  const [drillQuery, setDrillQuery] = useState(searchParams.get("drill") ?? "");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishLoadingId, setPublishLoadingId] = useState<string | null>(null);

  const syncParams = useCallback(
    (next: {
      sport?: string;
      batch?: string;
      date?: DateFilter;
      status?: StatusFilter;
      drill?: string;
    }) => {
      const params = new URLSearchParams();
      const resolvedSport = next.sport ?? sportId;
      const resolvedBatch = next.batch ?? batchId;
      const resolvedDate = next.date ?? dateFilter;
      const resolvedStatus = next.status ?? statusFilter;
      const resolvedDrill = next.drill ?? drillQuery;

      if (resolvedSport !== "all") {
        params.set("sport", resolvedSport);
      }
      if (resolvedBatch !== "all") {
        params.set("batch", resolvedBatch);
      }
      if (resolvedDate !== "all") {
        params.set("date", resolvedDate);
      }
      if (resolvedStatus !== "all") {
        params.set("status", resolvedStatus);
      }
      if (resolvedDrill.trim()) {
        params.set("drill", resolvedDrill.trim());
      }

      const query = params.toString();
      router.replace(
        query ? `${coachRoutes.mySubmissions}?${query}` : coachRoutes.mySubmissions,
        { scroll: false }
      );
    },
    [batchId, dateFilter, drillQuery, router, sportId, statusFilter]
  );

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

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (statusFilter === "published" && !post.isPublished) {
        return false;
      }
      if (statusFilter === "draft" && post.isPublished) {
        return false;
      }
      if (sportId !== "all" && post.sportId !== sportId) {
        return false;
      }
      if (batchId !== "all" && post.batchId !== batchId) {
        return false;
      }
      if (!matchesDateFilter(post.postedAt, dateFilter)) {
        return false;
      }
      if (drillQuery.trim()) {
        const q = drillQuery.trim().toLowerCase();
        if (!post.drillName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [batchId, dateFilter, drillQuery, posts, sportId, statusFilter]);

  const publishedCount = posts.filter((post) => post.isPublished).length;
  const draftCount = posts.length - publishedCount;

  async function handleTogglePublish(post: CoachDrillPostItem) {
    setPublishLoadingId(post.id);
    setPublishError(null);
    try {
      await api.coach.media.setDrillPostPublished(academyId, post.id, !post.isPublished);
      router.refresh();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Could not update publish status.");
    } finally {
      setPublishLoadingId(null);
    }
  }

  return (
    <PageBody>
      <div className="flex items-center gap-3 mb-5 min-w-0">
        <Link
          href={coachRoutes.media}
          className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink shrink-0 min-h-[44px] min-w-[44px]"
          aria-label="Back to media"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-[22px] font-bold text-ink tracking-[-0.3px]">
            My drill videos
          </h1>
          <p className="text-[13px] text-muted mt-[3px]">
            {posts.length} video{posts.length === 1 ? "" : "s"} posted · {publishedCount} live ·{" "}
            {draftCount} draft
          </p>
        </div>
        <Link
          href={coachRoutes.post}
          className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] shrink-0 min-h-[44px]"
        >
          <PlusIcon />
          <span className="hidden sm:inline">Post drill</span>
        </Link>
      </div>

      <div className="min-w-0">
        <FilterPills>
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
              { value: "all", label: "All statuses" },
              { value: "published", label: "Live" },
              { value: "draft", label: "Draft" },
            ]}
          />
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
        </FilterPills>

        <label className="block min-w-0 mb-4">
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

        {publishError ? (
          <p className="text-[12px] text-red-600 font-medium mb-3" role="alert">
            {publishError}
          </p>
        ) : null}

        {filteredPosts.length === 0 ? (
          <EmptyState
            compact
            icon={<VideoIcon className="w-5 h-5" />}
            title={posts.length === 0 ? "No drill videos yet" : "No videos match your filters"}
            description={
              posts.length === 0
                ? "Post a drill video for your players to practice and submit."
                : "Try adjusting your filters or search term."
            }
          />
        ) : (
          <div className="flex flex-col gap-[11px] min-w-0">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex gap-[11px] items-center p-[11px] border border-line rounded-xl bg-card shadow-card min-w-0"
              >
                <div
                  className="w-[46px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: post.thumbnailGradient }}
                >
                  <VideoIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[12.5px] text-text truncate">
                    {post.drillName}
                  </div>
                  <div className="text-[11.5px] text-muted truncate">
                    {post.sportName}
                    {post.batchName ? ` · ${post.batchName}` : ""} · {post.timeAgo}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Pill variant={post.isPublished ? "green" : "grey"}>
                    {post.isPublished ? "Live" : "Draft"}
                  </Pill>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(post)}
                    disabled={publishLoadingId === post.id}
                    className="min-h-[36px] px-2.5 rounded-[8px] border border-line text-[11px] font-semibold text-ink disabled:opacity-60"
                  >
                    {publishLoadingId === post.id
                      ? "…"
                      : post.isPublished
                        ? "Unpublish"
                        : "Publish"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageBody>
  );
}
