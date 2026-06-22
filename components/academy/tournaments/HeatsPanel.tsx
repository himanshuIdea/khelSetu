"use client";

import { useMemo } from "react";
import { SectionTitle } from "@/components/academy/shared";
import { TournamentMatchCard } from "@/components/academy/tournaments/TournamentMatchCard";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";

type HeatsPanelProps = {
  tournamentId: string;
  matches: DbBracketMatch[];
};

export function HeatsPanel({ tournamentId, matches }: HeatsPanelProps) {
  const heatRows = useMemo(() => {
    const byHeat = new Map<number, DbBracketMatch[]>();
    for (const match of matches) {
      const heat = match.heatNumber ?? 1;
      const list = byHeat.get(heat) ?? [];
      list.push(match);
      byHeat.set(heat, list);
    }
    return [...byHeat.entries()].sort(([a], [b]) => a - b);
  }, [matches]);

  return (
    <div className="mt-4 space-y-5">
      {heatRows.map(([heatNumber, rows]) => (
        <div key={heatNumber}>
          <SectionTitle title={`Heat ${heatNumber}`} subtitle="Lane assignments · record times & winners" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {rows
              .sort((a, b) => (a.laneNumber ?? 0) - (b.laneNumber ?? 0))
              .map((match) => (
                <TournamentMatchCard
                  key={match.id}
                  tournamentId={tournamentId}
                  match={match}
                  singleAthlete
                  advanceWinner={false}
                  compact
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
