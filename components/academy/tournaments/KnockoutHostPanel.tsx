"use client";

import { useMemo } from "react";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";
import { BracketMatchNode } from "@/components/academy/tournaments/BracketMatchNode";
import { SectionTitle } from "@/components/academy/shared";

const ROUND_ORDER = ["QF", "R1", "R2", "R3", "SF", "Final"];

function roundSortKey(round: string): number {
  const idx = ROUND_ORDER.indexOf(round);
  if (idx >= 0) return idx;
  if (round.startsWith("R")) return 1;
  return 50;
}

function roundLabel(round: string): string {
  if (round === "Final") return "Final";
  if (round === "SF") return "Semi-finals";
  if (round === "QF") return "Quarter-finals";
  return round;
}

type KnockoutHostPanelProps = {
  tournamentId: string;
  matches: DbBracketMatch[];
};

export function KnockoutHostPanel({ tournamentId, matches }: KnockoutHostPanelProps) {
  const columns = useMemo(() => {
    const byRound = new Map<string, DbBracketMatch[]>();
    for (const match of matches) {
      const list = byRound.get(match.round) ?? [];
      list.push(match);
      byRound.set(match.round, list);
    }

    return [...byRound.entries()]
      .sort(([a], [b]) => roundSortKey(a) - roundSortKey(b))
      .map(([round, rows]) => ({
        round,
        matches: [...rows].sort((a, b) => a.bracketPosition - b.bracketPosition),
      }));
  }, [matches]);

  if (columns.length === 0) return null;

  const firstColumnCount = columns[0]?.matches.length ?? 1;

  return (
    <div className="mt-3">
      <SectionTitle title="Knockout bracket" subtitle="Tap a player to record the winner" />

      <div className="mt-4 overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex items-stretch gap-0 min-w-max">
          {columns.map((column, columnIndex) => (
            <div key={column.round} className="flex items-stretch shrink-0">
              {columnIndex > 0 ? (
                <div
                  className="w-8 shrink-0 mx-1 border-l border-dashed border-line2 self-stretch"
                  aria-hidden
                />
              ) : null}

              <div
                className="flex flex-col shrink-0 w-[232px]"
                style={{ minHeight: `${Math.max(firstColumnCount, 1) * 132}px` }}
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted text-center mb-3">
                  {roundLabel(column.round)}
                </div>

                <div className="flex-1 flex flex-col justify-around gap-4">
                  {column.matches.map((match) => (
                    <div key={match.id} className="flex justify-center">
                      <BracketMatchNode tournamentId={tournamentId} match={match} advanceWinner />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
