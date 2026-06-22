export type DbBracketMatch = {
  id: string;
  round: string;
  bracketPosition: number;
  playerAName: string | null;
  playerBName: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  winnerPlayerId?: string | null;
  playerAId?: string | null;
  playerBId?: string | null;
  matLabel?: string | null;
  matchLabel?: string | null;
  scheduledAt?: string | null;
  heatNumber?: number | null;
  laneNumber?: number | null;
  groupLabel?: string | null;
  poolId?: string | null;
};

export function inferWinnerSide(match: DbBracketMatch): "a" | "b" | null {
  if (match.winnerPlayerId) {
    if (match.winnerPlayerId === match.playerAId) return "a";
    if (match.winnerPlayerId === match.playerBId) return "b";
  }
  if (match.scoreA != null && match.scoreB != null && match.scoreA !== match.scoreB) {
    return match.scoreA > match.scoreB ? "a" : "b";
  }
  return null;
}
