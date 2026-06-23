"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAcademyPageSearch } from "@/components/academy/AcademySearchContext";
import { CalendarIcon, PinIcon, TrophyIcon } from "@/components/academy/icons";
import { TournamentsPageHeader } from "@/components/academy/TournamentsPageHeader";
import { DoubleEliminationPanel } from "@/components/academy/tournaments/DoubleEliminationPanel";
import { HeatsPanel } from "@/components/academy/tournaments/HeatsPanel";
import { KnockoutHostPanel } from "@/components/academy/tournaments/KnockoutHostPanel";
import { PoolKnockoutPanel } from "@/components/academy/tournaments/PoolKnockoutPanel";
import { RoundRobinPanel } from "@/components/academy/tournaments/RoundRobinPanel";
import { TournamentOperationsModal } from "@/components/academy/tournaments/TournamentOperationsModal";
import { TournamentDragProvider } from "@/components/academy/tournaments/TournamentDragContext";
import { TournamentCollapsibleSection } from "@/components/academy/tournaments/TournamentCollapsibleSection";
import { TrialMeritPanel } from "@/components/academy/tournaments/TrialMeritPanel";
import { SimpleConfirmDialog } from "@/components/academy/UnassignConfirmDialog";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";
import {
  EmptyState,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
} from "@/components/academy/shared";
import { formatWeightKg } from "@/lib/format";
import { api, ApiError } from "@/lib/api";
import {
  competitionFormatLabel,
  type CompetitionFormat,
  type TournamentScheduleMatch,
  type TournamentStandingRow,
} from "@/lib/tournaments";
import { matchesStateTextSearch } from "@/lib/state-search";

type ActiveTournament = {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  participantAcademies: number;
  participantAthletes: number;
  weightClass: string;
  status: string;
  sportId: string;
  sportName: string;
  competitionFormat: CompetitionFormat;
  description: string | null;
};

type MedalTally = {
  gold: number;
  silver: number;
  bronze: number;
};

type SportOption = { id: string; name: string };

type TournamentsWorkspaceProps = {
  academyId: string;
  academyName: string;
  sports: SportOption[];
  tournament: ActiveTournament | null;
  bracketMatches: DbBracketMatch[];
  scheduleMatches: TournamentScheduleMatch[];
  medals: MedalTally;
  standings: TournamentStandingRow[];
};

function formatDateRange(startDate: Date, endDate: Date) {
  return `${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}–${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatScheduleTime(iso: string | null): string {
  if (!iso) return "Time TBD";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPanelSubtitle(format: CompetitionFormat): string {
  switch (format) {
    case "knockout":
      return "Quarter-finals → Final";
    case "double_elimination":
      return "Winners + losers brackets";
    case "round_robin":
      return "All-play-all · standings table";
    case "pool_knockout":
      return "Pool stage → knockout";
    case "heats":
      return "Heat sheet · lane assignments";
    case "trial":
      return "Merit-ranked selection list";
    default:
      return "";
  }
}

export function TournamentsWorkspace({
  academyId,
  academyName,
  sports,
  tournament,
  bracketMatches,
  scheduleMatches,
  medals,
  standings,
}: TournamentsWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useAcademyPageSearch();
  const [opsOpen, setOpsOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const dateRange = tournament ? formatDateRange(tournament.startDate, tournament.endDate) : "";
  const weightClass = tournament?.weightClass?.trim() || "—";
  const format = tournament?.competitionFormat ?? "knockout";
  const formatLabel = competitionFormatLabel(format);

  const liveMatch = useMemo(
    () => scheduleMatches.find((match) => match.status === "live") ?? null,
    [scheduleMatches]
  );

  const nextUp = useMemo(() => {
    const candidates = scheduleMatches.filter(
      (match) => match.status === "scheduled" && match.scheduledAt
    );
    return candidates.sort((a, b) => {
      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt;
    })[0] ?? null;
  }, [scheduleMatches]);

  const trialSlots = useMemo(
    () =>
      standings.map((row, index) => ({
        id: row.id,
        label: `Merit rank ${row.rank ?? index + 1} · rating ${row.rating ?? row.resultValue ?? "—"}`,
        athlete: row.playerName,
      })),
    [standings]
  );

  const filteredSchedulePreview = useMemo(() => {
    const preview = scheduleMatches.filter((match) => match.scheduledAt || match.status === "live");
    if (!searchQuery.trim()) return preview.slice(0, 4);
    return preview.filter((match) =>
      matchesStateTextSearch(searchQuery, [
        match.matchLabel,
        match.boutSummary,
        match.matLabel ?? "",
      ])
    );
  }, [scheduleMatches, searchQuery]);

  const tournamentHeaderMatches = useMemo(() => {
    if (!tournament || !searchQuery.trim()) return true;
    return matchesStateTextSearch(searchQuery, [
      tournament.name,
      tournament.location,
      tournament.sportName,
    ]);
  }, [tournament, searchQuery]);

  const hasMainContent = tournament != null && (bracketMatches.length > 0 || standings.length > 0);
  const showLivePill = Boolean(liveMatch) || tournament?.status === "live";

  async function confirmEndTournament() {
    if (!tournament) return;

    setEnding(true);
    setEndError(null);
    try {
      await api.tournaments.end(tournament.id);
      setEndConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setEndError(err instanceof ApiError ? err.message : "Could not end tournament.");
    } finally {
      setEnding(false);
    }
  }

  function renderFormatPanel() {
    if (!tournament) return null;

    switch (format) {
      case "round_robin":
        return (
          <RoundRobinPanel
            tournamentId={tournament.id}
            matches={bracketMatches}
            standings={standings}
          />
        );
      case "pool_knockout":
        return (
          <PoolKnockoutPanel
            tournamentId={tournament.id}
            matches={bracketMatches}
            standings={standings}
          />
        );
      case "double_elimination":
        return <DoubleEliminationPanel tournamentId={tournament.id} matches={bracketMatches} />;
      case "heats":
        return <HeatsPanel tournamentId={tournament.id} matches={bracketMatches} />;
      case "trial":
        return <TrialMeritPanel standings={standings} />;
      case "knockout":
      default:
        return <KnockoutHostPanel tournamentId={tournament.id} matches={bracketMatches} />;
    }
  }

  const workspace = (
    <div className="flex flex-col flex-1 min-w-0 w-full lg:min-h-0 lg:overflow-hidden">
      <TournamentsPageHeader academyId={academyId} sports={sports} />

      {tournament && tournamentHeaderMatches ? (
        <div className="shrink-0 bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-[18px]">
          <div className="w-[54px] h-[54px] rounded-[14px] bg-linear-to-br from-amber to-brand flex items-center justify-center shrink-0">
            <TrophyIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-ink">{tournament.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <PinIcon /> {tournament.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> {dateRange}
              </span>
              <span>{tournament.participantAcademies} academies</span>
              <span>{tournament.participantAthletes} athletes</span>
              <span>{tournament.sportName}</span>
              <span>{formatLabel}</span>
            </div>
            {tournament.description ? (
              <p className="text-[12px] text-muted mt-2">{tournament.description}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto shrink-0 min-w-0">
            <div className="flex flex-wrap items-center sm:justify-end gap-2">
              {showLivePill ? (
                <Pill variant="red" className="px-[13px] py-[7px]">
                  <span className="w-[7px] h-[7px] rounded-full bg-red animate-pulse" />
                  {liveMatch ? "Live now" : "Tournament live"}
                </Pill>
              ) : (
                <Pill variant="grey" className="px-[13px] py-[7px] capitalize">
                  {tournament.status}
                </Pill>
              )}
              {tournament.status === "live" ? (
                <button
                  type="button"
                  onClick={() => {
                    setEndError(null);
                    setEndConfirmOpen(true);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-[8px] border border-line text-[12px] font-semibold text-ink hover:bg-surface w-full sm:w-auto"
                >
                  End tournament
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!tournament ? (
        <EmptyState
          icon={<TrophyIcon className="w-5 h-5" />}
          title="No active tournament"
          description="Create a tournament to manage brackets, mat schedules and medal tallies for your academy."
        />
      ) : (
        <SplitLayout className="flex-1 lg:min-h-0 lg:overflow-hidden">
          <div className="flex-1 min-w-0 bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            <SectionTitle
              title={`${formatWeightKg(weightClass)} · ${formatLabel}`}
              subtitle={formatPanelSubtitle(format)}
            />
            {!hasMainContent ? (
              <EmptyState
                compact
                className="border-none shadow-none bg-surface/60 mt-4"
                icon={<TrophyIcon className="w-5 h-5" />}
                title="Structure not generated yet"
                description="Add participants when creating the tournament to generate matches and standings."
              />
            ) : (
              renderFormatPanel()
            )}
          </div>

          <SidePanel className="lg:min-h-0 lg:max-h-full">
            <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-[18px] lg:max-h-full lg:overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] space-y-1 lg:space-y-4 divide-y divide-line2 lg:divide-y-0">
              {liveMatch ? (
                <TournamentCollapsibleSection
                  title="Live now"
                  subtitle={liveMatch.matLabel ?? "Current bout"}
                  defaultExpanded
                  bareDesktop
                  className="lg:pb-0"
                >
                  <div className="p-3 border border-red/30 bg-red/5 rounded-[11px] lg:mt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill variant="red" className="text-[10px]">
                        <span className="w-[6px] h-[6px] rounded-full bg-red animate-pulse" />
                        Live now
                      </Pill>
                    </div>
                    <div className="text-[13px] font-bold text-ink break-words">{liveMatch.matchLabel}</div>
                    <div className="text-[11.5px] text-muted mt-1 break-words leading-snug">{liveMatch.boutSummary}</div>
                    {liveMatch.matLabel ? (
                      <div className="text-[11px] text-muted mt-1 lg:hidden">{liveMatch.matLabel}</div>
                    ) : null}
                  </div>
                </TournamentCollapsibleSection>
              ) : null}

              <TournamentCollapsibleSection
                title="Next up"
                subtitle="First scheduled bout on timeline"
                defaultExpanded
              >
                {nextUp ? (
                  <div className="p-3 border border-line rounded-[11px] lg:mt-0">
                    <div className="text-[12.5px] font-semibold text-ink">{nextUp.matchLabel}</div>
                    <div className="text-[11px] text-muted mt-1">{formatScheduleTime(nextUp.scheduledAt)}</div>
                    <div className="text-[11.5px] text-muted mt-1 break-words leading-snug">{nextUp.boutSummary}</div>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-muted lg:mt-0">No bouts scheduled yet.</p>
                )}
              </TournamentCollapsibleSection>

              <TournamentCollapsibleSection
                title="Today's timeline"
                subtitle="Quick preview"
                defaultExpanded={false}
              >
                {filteredSchedulePreview.length === 0 ? (
                  <EmptyState
                    compact
                    className="border-none shadow-none bg-surface/60 lg:mt-0"
                    icon={<CalendarIcon className="w-5 h-5" />}
                    title="No bouts on timeline"
                    description="Open schedule management to assign mat times."
                  />
                ) : (
                  <div className="flex flex-col gap-2 lg:mt-0">
                    {filteredSchedulePreview.map((match) => (
                      <div key={match.id} className="p-[11px] border border-line rounded-[11px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-[11px] font-semibold text-brand">{match.matchLabel}</span>
                          <span className="text-[11px] text-muted shrink-0">
                            {formatScheduleTime(match.scheduledAt)}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-muted mt-1 break-words leading-snug">{match.boutSummary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TournamentCollapsibleSection>

              <TournamentCollapsibleSection
                title="Medal tally"
                subtitle={academyName}
                defaultExpanded={false}
                bareDesktop
                className="lg:pt-3 lg:border-t lg:border-line2"
              >
                <div className="flex justify-between lg:mt-0">
                  <div>
                    <div className="font-bold text-base text-ink">{academyName}</div>
                    <div className="text-[11.5px] text-muted">Medal tally</div>
                  </div>
                  <div className="flex gap-2.5 font-bold">
                    <span className="text-amber">
                      {medals.gold}
                      <span className="text-[11.5px] text-muted font-normal block">Gold</span>
                    </span>
                    <span className="text-muted2">
                      {medals.silver}
                      <span className="text-[11.5px] text-muted font-normal block">Silver</span>
                    </span>
                    <span className="text-[#CD7F32]">
                      {medals.bronze}
                      <span className="text-[11.5px] text-muted font-normal block">Bronze</span>
                    </span>
                  </div>
                </div>
              </TournamentCollapsibleSection>

              <div className="pt-3 lg:pt-0 border-t-0 lg:border-t-0">
                <button
                  type="button"
                  onClick={() => setOpsOpen(true)}
                  className="w-full min-h-[44px] rounded-[8px] bg-brand text-white text-[13px] font-semibold"
                >
                  Manage schedule & medals
                </button>
              </div>
            </div>
          </SidePanel>
        </SplitLayout>
      )}

      {tournament ? (
        <>
          <TournamentOperationsModal
            open={opsOpen}
            onClose={() => setOpsOpen(false)}
            tournamentId={tournament.id}
            academyName={academyName}
            format={format}
            scheduleMatches={scheduleMatches}
            medals={medals}
            trialSlots={trialSlots}
          />

          <SimpleConfirmDialog
            open={endConfirmOpen}
            title="End this tournament?"
            description="It will no longer show as the active tournament."
            confirmLabel="End tournament"
            submittingLabel="Ending…"
            isSubmitting={ending}
            error={endError}
            onCancel={() => {
              if (ending) return;
              setEndConfirmOpen(false);
              setEndError(null);
            }}
            onConfirm={() => void confirmEndTournament()}
          />
        </>
      ) : null}
    </div>
  );

  return tournament ? (
    <TournamentDragProvider>{workspace}</TournamentDragProvider>
  ) : (
    workspace
  );
}
