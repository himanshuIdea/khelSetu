"use client";



import { useMemo, useState } from "react";

import { SectionTitle } from "@/components/academy/shared";

import { KnockoutHostPanel } from "@/components/academy/tournaments/KnockoutHostPanel";

import { TournamentMatchCard } from "@/components/academy/tournaments/TournamentMatchCard";

import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";

import type { TournamentStandingRow } from "@/lib/tournaments";



type PoolKnockoutPanelProps = {

  tournamentId: string;

  matches: DbBracketMatch[];

  standings: TournamentStandingRow[];

};



export function PoolKnockoutPanel({ tournamentId, matches, standings }: PoolKnockoutPanelProps) {

  const poolNames = useMemo(

    () => [...new Set(standings.map((row) => row.poolName))],

    [standings]

  );

  const [activeTab, setActiveTab] = useState<"pools" | "knockout">("pools");

  const [activePool, setActivePool] = useState(poolNames[0] ?? "Pool A");



  const poolMatches = matches.filter((m) => m.round === "Pool");

  const knockoutMatches = matches.filter((m) => m.round === "SF" || m.round === "Final");

  const poolStandings = standings.filter((row) => row.poolName === activePool);



  const poolIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of standings) map.set(row.poolName, row.poolId);
    return map;
  }, [standings]);

  const activePoolId = poolIdByName.get(activePool);

  const activePoolMatches = activePoolId
    ? poolMatches.filter((match) => match.poolId === activePoolId)
    : poolMatches;



  return (

    <div className="mt-4 space-y-4">

      <div className="flex gap-2">

        <button

          type="button"

          onClick={() => setActiveTab("pools")}

          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border ${

            activeTab === "pools" ? "bg-brand-soft border-brand text-brand" : "border-line text-muted"

          }`}

        >

          Pool stage

        </button>

        <button

          type="button"

          onClick={() => setActiveTab("knockout")}

          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border ${

            activeTab === "knockout" ? "bg-brand-soft border-brand text-brand" : "border-line text-muted"

          }`}

        >

          Knockout

        </button>

      </div>



      {activeTab === "pools" ? (

        <>

          <div className="flex flex-wrap gap-2">

            {poolNames.map((name) => (

              <button

                key={name}

                type="button"

                onClick={() => setActivePool(name)}

                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${

                  activePool === name ? "bg-brand text-white border-brand" : "border-line text-muted"

                }`}

              >

                {name}

              </button>

            ))}

          </div>

          <SectionTitle title={`${activePool} standings`} subtitle="Top 2 advance to semis" />

          <div className="overflow-x-auto mt-3">

            <table className="w-full text-[12px] min-w-[360px]">

              <thead>

                <tr className="text-muted border-b border-line2">

                  <th className="text-left py-2 pr-3">Athlete</th>

                  <th className="text-right py-2 px-2">P</th>

                  <th className="text-right py-2 px-2">W</th>

                  <th className="text-right py-2 px-2">L</th>

                  <th className="text-right py-2 pl-2">Pts</th>

                </tr>

              </thead>

              <tbody>

                {poolStandings.map((row) => (

                  <tr key={row.id} className="border-b border-line2/60">

                    <td className="py-2.5 pr-3 font-medium">{row.playerName}</td>

                    <td className="py-2.5 px-2 text-right">{row.played}</td>

                    <td className="py-2.5 px-2 text-right">{row.won}</td>

                    <td className="py-2.5 px-2 text-right">{row.lost}</td>

                    <td className="py-2.5 pl-2 text-right font-semibold">{row.points}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <SectionTitle title="Pool fixtures" subtitle="Round-robin within pool" />

          <div className="flex flex-wrap gap-2 mt-3">

            {activePoolMatches.map((match) => (

              <TournamentMatchCard

                key={match.id}

                tournamentId={tournamentId}

                match={match}

                advanceWinner={false}

                compact

              />

            ))}

          </div>

        </>

      ) : (

        <KnockoutHostPanel tournamentId={tournamentId} matches={knockoutMatches} />

      )}

    </div>

  );

}

