"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { VideoIcon } from "@/components/academy/icons";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { EmptyState, FilterPills, Pill, type PillVariant } from "@/components/academy/shared";
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { playerLayout } from "@/lib/player-layout";
import { playerDrillDetailRoute, playerRoutes } from "@/lib/player-nav";
import type {
  PlayerDrillDateFilter,
  PlayerDrillPost,
  PlayerDrillPostDetail,
  PlayerDrillSubmissionStatus,
} from "@/lib/repositories/player-drills";

function playerDrillStatusLabel(status: PlayerDrillSubmissionStatus): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "reviewed":
      return "Reviewed";
    default:
      return "Not submitted";
  }
}

function playerDrillStatusVariant(status: PlayerDrillSubmissionStatus): PillVariant {
  switch (status) {
    case "pending":
      return "amber";
    case "reviewed":
      return "green";
    default:
      return "grey";
  }
}

function matchesDateFilter(postedAt: string, dateFilter: PlayerDrillDateFilter): boolean {
  if (dateFilter === "all") {
    return true;
  }
  const posted = new Date(postedAt).getTime();
  const days = dateFilter === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return posted >= cutoff;
}

type PlayerDrillFiltersProps = {
  sportId: string;
  dateFilter: PlayerDrillDateFilter;
  sportOptions: { value: string; label: string }[];
  onSportChange: (value: string) => void;
  onDateChange: (value: PlayerDrillDateFilter) => void;
};

function PlayerDrillFilters({
  sportId,
  dateFilter,
  sportOptions,
  onSportChange,
  onDateChange,
}: PlayerDrillFiltersProps) {
  return (
    <FilterPills>
      <InlineSelect
        variant="pill"
        filterPill
        aria-label="Filter by sport"
        value={sportId}
        onChange={onSportChange}
        active={sportId !== "all"}
        menuMaxHeightClass="max-h-52"
        className="shrink-0 text-[12.5px] font-medium px-[13px] py-2 min-h-[44px]"
        options={sportOptions}
      />
      <InlineSelect
        variant="pill"
        filterPill
        aria-label="Filter by date"
        value={dateFilter}
        onChange={(value) => onDateChange(value as PlayerDrillDateFilter)}
        active={dateFilter !== "all"}
        className="shrink-0 text-[12.5px] font-medium px-[13px] py-2 min-h-[44px]"
        options={[
          { value: "all", label: "All dates" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
        ]}
      />
    </FilterPills>
  );
}

function PlayerDrillCard({ drill }: { drill: PlayerDrillPost }) {
  return (
    <Link
      href={playerDrillDetailRoute(drill.id)}
      className="flex gap-3 items-center p-3 border border-line rounded-[14px] bg-card min-w-0 min-h-[44px] hover:border-brand/30 transition-colors"
    >
      <div
        className="w-[52px] h-[38px] rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: drill.thumbnailGradient }}
      >
        <VideoIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] text-ink truncate">{drill.drillName}</div>
        <div className="text-[11.5px] text-muted truncate">
          {drill.coachName} · {drill.sportName} · {drill.timeAgo}
        </div>
      </div>
      <Pill variant={playerDrillStatusVariant(drill.submissionStatus)} className="shrink-0">
        {playerDrillStatusLabel(drill.submissionStatus)}
      </Pill>
    </Link>
  );
}

type PlayerDrillsWorkspaceProps = {
  drills: PlayerDrillPost[];
};

export function PlayerDrillsWorkspace({ drills }: PlayerDrillsWorkspaceProps) {
  const [sportId, setSportId] = useState("all");
  const [dateFilter, setDateFilter] = useState<PlayerDrillDateFilter>("all");

  const sportOptions = useMemo(() => {
    const sports = new Map<string, string>();
    for (const drill of drills) {
      sports.set(drill.sportId, drill.sportName);
    }
    return [
      { value: "all", label: "All sports" },
      ...Array.from(sports.entries()).map(([id, name]) => ({ value: id, label: name })),
    ];
  }, [drills]);

  const filtered = useMemo(() => {
    return drills.filter((drill) => {
      if (sportId !== "all" && drill.sportId !== sportId) {
        return false;
      }
      if (!matchesDateFilter(drill.postedAt, dateFilter)) {
        return false;
      }
      return true;
    });
  }, [dateFilter, drills, sportId]);

  const hasActiveFilters = sportId !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSportId("all");
    setDateFilter("all");
  };

  if (drills.length === 0) {
    return (
      <EmptyState
        compact
        icon={<VideoIcon className="w-5 h-5" />}
        title="No drills assigned yet"
        description="When your coach posts a drill for your batch, it will appear here."
        className="w-full min-w-0"
      />
    );
  }

  return (
    <div className="min-w-0 flex flex-col gap-3">
      <PlayerDrillFilters
        sportId={sportId}
        dateFilter={dateFilter}
        sportOptions={sportOptions}
        onSportChange={setSportId}
        onDateChange={setDateFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={<VideoIcon className="w-5 h-5" />}
          title="No drills match filters"
          description="Try changing sport or date filters."
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-semibold text-brand"
              >
                Clear filters
              </button>
            ) : undefined
          }
          className="w-full min-w-0"
        />
      ) : (
        <div className="flex flex-col gap-2.5 min-w-0">
          {filtered.map((drill) => (
            <PlayerDrillCard key={drill.id} drill={drill} />
          ))}
        </div>
      )}
    </div>
  );
}

type PlayerDrillDetailContentProps = {
  drill: PlayerDrillPostDetail;
};

export function PlayerDrillDetailContent({ drill }: PlayerDrillDetailContentProps) {
  const submitHref = `${playerRoutes.submit}?drillPostId=${encodeURIComponent(drill.id)}`;

  return (
    <div className="flex flex-col gap-4 min-w-0 pb-2">
      <div className={`${playerLayout.cardLg} overflow-hidden min-w-0`}>
        <InlineVideoPlayer
          src={drill.videoUrl}
          posterGradient={drill.thumbnailGradient}
          durationSeconds={drill.durationSeconds}
          tag={drill.sportName}
          variant="detail"
          ariaLabel={`Play ${drill.drillName}`}
          className="rounded-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Pill variant={playerDrillStatusVariant(drill.submissionStatus)}>
          {playerDrillStatusLabel(drill.submissionStatus)}
        </Pill>
        <span className="text-[12px] text-muted truncate">
          {drill.coachName} · {drill.sportName} · {drill.batchName} · {drill.timeAgo}
        </span>
      </div>

      <div className="min-w-0">
        <h2 className="text-[16px] font-bold text-ink tracking-tight">{drill.drillName}</h2>
        {drill.description ? (
          <p className="text-[13px] text-muted leading-relaxed mt-2 whitespace-pre-wrap">
            {drill.description}
          </p>
        ) : (
          <p className="text-[13px] text-muted2 mt-2">No description provided.</p>
        )}
      </div>

      {drill.review && (
        <div className={`${playerLayout.card} p-4 min-w-0`}>
          <div className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">
            Coach review
          </div>
          <div className="text-[22px] font-bold text-ink leading-none">
            {drill.review.rating}
            <span className="text-[13px] font-semibold text-muted"> / 10</span>
          </div>
          {drill.review.notes && (
            <p className="text-[13px] text-muted mt-2 leading-relaxed">{drill.review.notes}</p>
          )}
        </div>
      )}

      {drill.submissionStatus === "not_submitted" && (
        <Link
          href={submitHref}
          className="inline-flex items-center justify-center w-full min-h-[44px] bg-brand text-white font-semibold text-[13px] rounded-[12px] px-4"
        >
          Submit your video
        </Link>
      )}

      {drill.submissionStatus === "pending" && (
        <p className="text-[13px] text-muted text-center py-2">
          Your submission is awaiting coach review.
        </p>
      )}
    </div>
  );
}
