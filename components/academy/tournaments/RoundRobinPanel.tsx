"use client";



import { SectionTitle } from "@/components/academy/shared";

import { TournamentMatchCard } from "@/components/academy/tournaments/TournamentMatchCard";

import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";

import type { TournamentStandingRow } from "@/lib/tournaments";



type RoundRobinPanelProps = {

  tournamentId: string;

  matches: DbBracketMatch[];

  standings: TournamentStandingRow[];

};



export function RoundRobinPanel({ tournamentId, matches, standings }: RoundRobinPanelProps) {

  return (

    <div className="mt-4 space-y-5">

      <div>

        <SectionTitle title="Standings" subtitle="Points table · all players in one pool" />

        <div className="max-w-full overflow-x-auto mt-3 -mx-1 px-1 overscroll-x-contain [-webkit-overflow-scrolling:touch]">

          <table className="w-full text-[12px] min-w-[420px]">

            <thead>

              <tr className="text-muted border-b border-line2">

                <th className="text-left py-2 pr-3 font-semibold">#</th>

                <th className="text-left py-2 pr-3 font-semibold">Athlete</th>

                <th className="text-left py-2 pr-3 font-semibold">Academy</th>

                <th className="text-right py-2 px-2 font-semibold">P</th>

                <th className="text-right py-2 px-2 font-semibold">W</th>

                <th className="text-right py-2 px-2 font-semibold">L</th>

                <th className="text-right py-2 pl-2 font-semibold">Pts</th>

              </tr>

            </thead>

            <tbody>

              {standings.map((row, index) => (

                <tr key={row.id} className="border-b border-line2/60">

                  <td className="py-2.5 pr-3 text-muted">{row.rank ?? index + 1}</td>

                  <td className="py-2.5 pr-3 font-medium text-ink">{row.playerName}</td>

                  <td className="py-2.5 pr-3 text-muted">{row.academyName}</td>

                  <td className="py-2.5 px-2 text-right">{row.played}</td>

                  <td className="py-2.5 px-2 text-right">{row.won}</td>

                  <td className="py-2.5 px-2 text-right">{row.lost}</td>

                  <td className="py-2.5 pl-2 text-right font-semibold">{row.points}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>



      <div>

        <SectionTitle title="Fixtures" subtitle="Mark winners on each match card" />

        <div className="flex flex-wrap gap-2 mt-3 max-w-full">

          {matches.map((match) => (

            <TournamentMatchCard

              key={match.id}

              tournamentId={tournamentId}

              match={match}

              advanceWinner={false}

              compact

            />

          ))}

        </div>

      </div>

    </div>

  );

}

