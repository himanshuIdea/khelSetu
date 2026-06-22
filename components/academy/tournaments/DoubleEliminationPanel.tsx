"use client";

import { useMemo } from "react";
import { SectionTitle } from "@/components/academy/shared";
import { BracketMatchNode } from "@/components/academy/tournaments/BracketMatchNode";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";

const WB_ORDER = ["WB-R1", "WB-SF", "WB-Final"];
const LB_ORDER = ["LB-R1", "LB-Final"];

function sortByRoundOrder(matches: DbBracketMatch[], order: string[]) {
  return [...matches].sort((a, b) => {
    const ai = order.indexOf(a.round);
    const bi = order.indexOf(b.round);
    const aKey = ai >= 0 ? ai : 99;
    const bKey = bi >= 0 ? bi : 99;
    if (aKey !== bKey) return aKey - bKey;
    return a.bracketPosition - b.bracketPosition;
  });
}

type DoubleEliminationPanelProps = {
  tournamentId: string;
  matches: DbBracketMatch[];
};

export function DoubleEliminationPanel({ tournamentId, matches }: DoubleEliminationPanelProps) {
  const winners = useMemo(
    () =>
      sortByRoundOrder(
        matches.filter((m) => m.groupLabel === "winners" || m.round.startsWith("WB")),
        WB_ORDER
      ),
    [matches]
  );

  const losers = useMemo(
    () =>
      sortByRoundOrder(
        matches.filter((m) => m.groupLabel === "losers" || m.round.startsWith("LB")),
        LB_ORDER
      ),
    [matches]
  );

  const grandFinal = useMemo(
    () => matches.filter((m) => m.groupLabel === "grand_final" || m.round === "Final"),
    [matches]
  );

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div>
        <SectionTitle title="Winners bracket" subtitle="Winners advance · losers drop to LB" />
        <div className="flex flex-wrap gap-2.5 mt-3">
          {winners.map((match) => (
            <BracketMatchNode
              key={match.id}
              tournamentId={tournamentId}
              match={match}
              advanceWinner
            />
          ))}
        </div>
      </div>
      <div>
        <SectionTitle title="Losers bracket" subtitle="Must lose twice to exit" />
        <div className="flex flex-wrap gap-2.5 mt-3">
          {losers.map((match) => (
            <BracketMatchNode
              key={match.id}
              tournamentId={tournamentId}
              match={match}
              advanceWinner
            />
          ))}
        </div>
      </div>
      {grandFinal.length > 0 ? (
        <div className="lg:col-span-2">
          <SectionTitle title="Grand final" />
          <div className="mt-3">
            <BracketMatchNode
              tournamentId={tournamentId}
              match={grandFinal[0]}
              advanceWinner={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
