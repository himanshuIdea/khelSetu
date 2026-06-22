import type { CompetitionFormat } from "@/lib/tournaments";

type BuildMatchLabelParams = {
  format: CompetitionFormat;
  round: string;
  bracketPosition: number;
  poolName?: string;
  heatNumber?: number | null;
  laneNumber?: number | null;
  groupLabel?: string | null;
};

export function buildMatchLabel(params: BuildMatchLabelParams): string {
  const position = params.bracketPosition + 1;
  const { round, format, groupLabel } = params;

  if (format === "heats" || round === "Heat") {
    const heat = params.heatNumber ?? Math.ceil(position / 6);
    const lane = params.laneNumber ?? position;
    return `Heat ${heat} · Lane ${lane}`;
  }

  if (groupLabel === "grand_final" || (round === "Final" && groupLabel === "grand_final")) {
    return "Grand Final";
  }

  if (round === "Final") return "Final";
  if (round === "SF") return `SF ${position}`;

  if (groupLabel === "winners" || round.startsWith("WB")) {
    return `WB Match ${position}`;
  }

  if (groupLabel === "losers" || round.startsWith("LB")) {
    return `LB Match ${position}`;
  }

  if (round === "Pool" && params.poolName) {
    return `${params.poolName} · Match ${position}`;
  }

  if (round === "RR" || round === "QF" || round.startsWith("R")) {
    return `Match ${position}`;
  }

  return `Match ${position}`;
}

export function defaultMatLabel(matchLabel: string, mat = "Mat 1"): string {
  return `${mat} · ${matchLabel}`;
}

export function resolveMatchDisplayLabel(match: {
  matchLabel?: string | null;
  round: string;
  bracketPosition: number;
  heatNumber?: number | null;
  laneNumber?: number | null;
  groupLabel?: string | null;
}): string {
  if (match.matchLabel?.trim()) return match.matchLabel.trim();
  if (match.round === "Heat") {
    return `Heat ${match.heatNumber ?? 1} · Lane ${match.laneNumber ?? match.bracketPosition + 1}`;
  }
  if (match.groupLabel === "grand_final") return "Grand Final";
  if (match.round === "Final") return "Final";
  if (match.round === "SF") return `SF ${match.bracketPosition + 1}`;
  if (match.groupLabel === "winners" || match.round.startsWith("WB")) {
    return `WB Match ${match.bracketPosition + 1}`;
  }
  if (match.groupLabel === "losers" || match.round.startsWith("LB")) {
    return `LB Match ${match.bracketPosition + 1}`;
  }
  return `Match ${match.bracketPosition + 1}`;
}
