"use client";

import { SectionTitle } from "@/components/academy/shared";
import type { TournamentStandingRow } from "@/lib/tournaments";

type TrialMeritPanelProps = {
  standings: TournamentStandingRow[];
};

export function TrialMeritPanel({ standings }: TrialMeritPanelProps) {
  const sorted = [...standings].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  return (
    <div className="mt-4">
      <SectionTitle
        title="Merit list"
        subtitle="Ranked by KhelSetu rating · selection committee reference"
      />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-[12px] min-w-[420px]">
          <thead>
            <tr className="text-muted border-b border-line2">
              <th className="text-left py-2 pr-3">Rank</th>
              <th className="text-left py-2 pr-3">Athlete</th>
              <th className="text-left py-2 pr-3">Academy</th>
              <th className="text-right py-2 pl-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.id} className="border-b border-line2/60">
                <td className="py-2.5 pr-3 font-semibold text-brand">{row.rank ?? index + 1}</td>
                <td className="py-2.5 pr-3 font-medium text-ink">{row.playerName}</td>
                <td className="py-2.5 pr-3 text-muted">{row.academyName}</td>
                <td className="py-2.5 pl-2 text-right font-semibold">{row.rating ?? row.resultValue ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
