"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, PinIcon, TrophyIcon } from "@/components/academy/icons";
import { TournamentsPageHeader } from "@/components/academy/TournamentsPageHeader";
import {
  EmptyState,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
} from "@/components/academy/shared";
import { formatWeightKg } from "@/lib/format";
import {
  buildDemoTournamentView,
  DEMO_FINAL_MATCH,
  DEMO_MAT_SCHEDULE,
  DEMO_MEDAL_TALLY,
  DEMO_QF_MATCHES,
  DEMO_SF_MATCHES,
  type CreateTournamentFormValues,
  type DemoTournamentView,
} from "@/lib/tournaments-demo";

type SeedTournament = {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  participantAcademies: number;
  participantAthletes: number;
  weightClass: string;
  status: string;
};

type BracketMatch = {
  id: string;
  round: string;
  playerAName: string | null;
  playerBName: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  matLabel: string | null;
};

type MatScheduleItem = {
  mat: string;
  time: string;
  bout: string;
  variant: "red" | "grey" | "amber";
};

type MedalTally = {
  gold: number;
  silver: number;
  bronze: number;
};

type TournamentsWorkspaceProps = {
  academyName: string;
  seedTournament: SeedTournament | null;
  seedBracketMatches: BracketMatch[];
  seedMatSchedule: MatScheduleItem[];
  seedMedals: MedalTally;
};

function formatSeedDateRange(startDate: Date, endDate: Date) {
  return `${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}–${endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function TournamentsWorkspace({
  academyName,
  seedTournament,
  seedBracketMatches,
  seedMatSchedule,
  seedMedals,
}: TournamentsWorkspaceProps) {
  const [demoTournament, setDemoTournament] = useState<DemoTournamentView | null>(null);

  const isDemo = demoTournament != null;
  const activeTournament = isDemo ? demoTournament : seedTournament;

  const dateRange = isDemo
    ? demoTournament.dateRange
    : seedTournament
      ? formatSeedDateRange(seedTournament.startDate, seedTournament.endDate)
      : "";

  const weightClass = isDemo
    ? demoTournament.weightClass
    : seedTournament?.weightClass?.trim() || "65";

  const tournamentType = isDemo ? demoTournament.tournamentType : "Knockout";

  const qfMatches = useMemo(() => {
    if (isDemo) return DEMO_QF_MATCHES;

    return seedBracketMatches
      .filter((m) => m.round === "QF")
      .map((m) => ({
        top: m.playerAName ?? "TBD",
        topScore: String(m.scoreA ?? ""),
        bottom: m.playerBName ?? "TBD",
        bottomScore: String(m.scoreB ?? ""),
        winner:
          m.scoreA != null && m.scoreB != null
            ? m.scoreA > m.scoreB
              ? ("top" as const)
              : ("bottom" as const)
            : ("top" as const),
      }));
  }, [isDemo, seedBracketMatches]);

  const sfMatches = useMemo(() => {
    if (isDemo) return DEMO_SF_MATCHES;
    return seedBracketMatches.filter((m) => m.round === "SF");
  }, [isDemo, seedBracketMatches]);

  const finalMatch = useMemo(() => {
    if (isDemo) return DEMO_FINAL_MATCH;
    const match = seedBracketMatches.find((m) => m.round === "Final");
    if (!match) return null;
    return {
      playerAName: match.playerAName ?? "Winner SF1",
      playerBName: match.playerBName ?? "Winner SF2",
      matLabel: match.matLabel ?? undefined,
    };
  }, [isDemo, seedBracketMatches]);

  const matSchedule = isDemo ? DEMO_MAT_SCHEDULE : seedMatSchedule;
  const medals = isDemo ? DEMO_MEDAL_TALLY : seedMedals;

  const hasBracket =
    qfMatches.length > 0 || sfMatches.length > 0 || finalMatch != null;

  function handleCreate(values: CreateTournamentFormValues) {
    setDemoTournament(buildDemoTournamentView(values));
  }

  return (
    <>
      <TournamentsPageHeader onCreate={handleCreate} />

      {activeTournament && (
        <div className="bg-card border border-line rounded-(--radius) shadow-card p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-[18px]">
          <div className="w-[54px] h-[54px] rounded-[14px] bg-linear-to-br from-amber to-brand flex items-center justify-center shrink-0">
            <TrophyIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-ink">{activeTournament.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <PinIcon /> {activeTournament.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> {dateRange}
              </span>
              <span>{activeTournament.participantAcademies} academies</span>
              <span>{activeTournament.participantAthletes} athletes</span>
              {isDemo && demoTournament.sport ? (
                <span>{demoTournament.sport}</span>
              ) : null}
            </div>
            {isDemo && demoTournament.description ? (
              <p className="text-[12px] text-muted mt-2">{demoTournament.description}</p>
            ) : null}
          </div>
          <Pill variant="red" className="px-[13px] py-[7px] self-start sm:self-auto">
            <span className="w-[7px] h-[7px] rounded-full bg-red" />
            Live now
          </Pill>
        </div>
      )}

      {!activeTournament ? (
        <EmptyState
          icon={<TrophyIcon className="w-5 h-5" />}
          title="No active tournament"
          description="Create a tournament to manage brackets, mat schedules and medal tallies for your academy."
        />
      ) : (
        <SplitLayout>
          <div className="flex-1 min-w-0 bg-card border border-line rounded-(--radius) shadow-card p-5">
            <SectionTitle
              title={`${formatWeightKg(weightClass)} · ${tournamentType} bracket`}
              subtitle="Quarter-finals → Final"
            />
            {!hasBracket ? (
              <EmptyState
                compact
                className="border-none shadow-none bg-surface/60 mt-4"
                icon={<TrophyIcon className="w-5 h-5" />}
                title="Bracket not set up yet"
                description="Add participants and generate match-ups to see the knockout bracket here."
              />
            ) : (
              <div className="overflow-x-auto -mx-1 px-1 mt-[18px]">
                <div className="flex items-stretch gap-0 text-[11.5px] min-w-[480px]">
                  <div className="flex flex-col justify-around gap-3.5 flex-1">
                    {qfMatches.map((m) => (
                      <div
                        key={`${m.top}-${m.bottom}`}
                        className="bg-card border border-line rounded-(--radius) overflow-hidden"
                      >
                        <div
                          className={`flex justify-between px-2.5 py-2 border-b border-line2 ${m.winner === "top" ? "font-semibold text-ink" : "text-muted"}`}
                        >
                          {m.top}{" "}
                          <span className={m.winner === "top" ? "text-green" : ""}>{m.topScore}</span>
                        </div>
                        <div
                          className={`flex justify-between px-2.5 py-2 ${m.winner === "bottom" ? "font-semibold text-ink" : "text-muted"}`}
                        >
                          {m.bottom}{" "}
                          <span className={m.winner === "bottom" ? "text-green" : ""}>
                            {m.bottomScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-[26px] flex flex-col justify-around">
                    <div className="h-0.5 bg-line my-[30px]" />
                    <div className="h-0.5 bg-line my-[30px]" />
                  </div>
                  <div className="flex flex-col justify-around flex-1 gap-3.5">
                    {sfMatches.map((m) => {
                      const isLive = "status" in m && m.status === "live";
                      const playerA = "playerAName" in m ? m.playerAName : "";
                      const playerB = "playerBName" in m ? m.playerBName : "";
                      const key = "id" in m ? m.id : `${playerA}-${playerB}`;

                      return (
                        <div
                          key={key}
                          className={`bg-card border rounded-(--radius) overflow-hidden ${isLive ? "border-brand" : "border-line"}`}
                        >
                          <div
                            className={`flex justify-between px-2.5 py-2 border-b border-line2 ${isLive ? "font-semibold text-ink" : "text-muted"}`}
                          >
                            {playerA}{" "}
                            {isLive && <span className="text-brand font-bold">live</span>}
                          </div>
                          <div
                            className={`flex justify-between px-2.5 py-2 ${isLive ? "font-semibold text-ink" : "text-muted"}`}
                          >
                            {playerB}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-[26px] flex items-center">
                    <div className="h-0.5 bg-line w-full" />
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <div className="bg-ink border-none rounded-(--radius) overflow-hidden text-white">
                      <div className="flex justify-between px-[11px] py-[9px] border-b border-white/12">
                        {finalMatch?.playerAName ?? "Winner SF1"}
                      </div>
                      <div className="flex justify-between px-[11px] py-[9px] text-[#A9B5D1]">
                        {finalMatch?.playerBName ?? "Winner SF2"}
                      </div>
                    </div>
                    <div className="text-center mt-2.5 text-muted text-[10.5px]">
                      FINAL{finalMatch?.matLabel ? ` · ${finalMatch.matLabel}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SidePanel>
            <div className="bg-card border border-line rounded-(--radius) shadow-card p-[18px]">
              <SectionTitle title="Mat schedule · today" />
              {matSchedule.length === 0 ? (
                <EmptyState
                  compact
                  className="border-none shadow-none bg-surface/60 mt-3"
                  icon={<CalendarIcon className="w-5 h-5" />}
                  title="No bouts scheduled"
                  description="Mat assignments for today's tournament bouts will show up here."
                />
              ) : (
                <div className="flex flex-col gap-[11px] mt-3">
                  {matSchedule.map((s) => (
                    <div key={s.bout} className="p-[11px] border border-line rounded-[11px]">
                      <div className="flex justify-between gap-2">
                        <Pill variant={s.variant} className="text-[10px]">
                          {s.variant === "red" && (
                            <span className="w-[7px] h-[7px] rounded-full bg-red" />
                          )}
                          {s.mat}
                        </Pill>
                        <span className="text-[11.5px] text-muted shrink-0">{s.time}</span>
                      </div>
                      <div className="font-semibold text-[12.5px] mt-[7px]">{s.bout}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3.5 border-t border-line2 flex justify-between">
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
            </div>
          </SidePanel>
        </SplitLayout>
      )}
    </>
  );
}
