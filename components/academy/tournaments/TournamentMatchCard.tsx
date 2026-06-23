"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrophyIcon } from "@/components/academy/icons";
import { AthleteSlot } from "@/components/academy/tournaments/AthleteSlot";
import { inferWinnerSide } from "@/components/academy/tournaments/bracket-utils";
import { resolveMatchDisplayLabel } from "@/lib/tournament-match-labels";
import { getInitials } from "@/lib/format";
import { api, ApiError } from "@/lib/api";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

type TournamentMatchCardProps = {
  tournamentId: string;
  match: DbBracketMatch;
  advanceWinner?: boolean;
  singleAthlete?: boolean;
  compact?: boolean;
};

export function TournamentMatchCard({
  tournamentId,
  match,
  advanceWinner = false,
  singleAthlete = false,
  compact = false,
}: TournamentMatchCardProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = match.matchLabel?.trim() || resolveMatchDisplayLabel(match);
  const winnerSide = inferWinnerSide(match);
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed" || winnerSide != null;

  async function markWinner(side: "a" | "b") {
    setSaving(true);
    setError(null);
    try {
      await api.tournaments.updateMatch(tournamentId, match.id, {
        scoreA: side === "a" ? 1 : 0,
        scoreB: side === "b" ? 1 : 0,
        winnerSide: side,
        status: "completed",
        advanceWinner,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save result.");
    } finally {
      setSaving(false);
    }
  }

  function AthleteRow({ side, name }: { side: "a" | "b"; name: string | null }) {
    const displayName = name?.trim() || "TBD";
    const isWinner = winnerSide === side;
    const canWin = !isCompleted && displayName !== "TBD" && displayName !== "BYE";
    const score = side === "a" ? match.scoreA : match.scoreB;
    const playerId = side === "a" ? match.playerAId : match.playerBId;

    return (
      <AthleteSlot
        tournamentId={tournamentId}
        matchId={match.id}
        side={side}
        playerId={playerId}
        playerName={name}
        matchCompleted={isCompleted}
      >
        <div className={`rounded-[8px] px-2 py-1.5 ${isWinner ? "bg-brand-soft/50" : ""}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
              style={{ background: avatarColor(displayName) }}
            >
              {getInitials(displayName).slice(0, 2)}
            </span>
            <span
              className="flex-1 min-w-0 text-[12px] font-medium text-ink truncate whitespace-nowrap"
              title={displayName}
            >
              {displayName}
            </span>
            {isWinner ? <TrophyIcon className="w-3.5 h-3.5 text-brand shrink-0" /> : null}
            {isCompleted && score != null ? (
              <span className="text-[12px] font-bold text-ink shrink-0">{score}</span>
            ) : null}
          </div>
          {canWin ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void markWinner(side)}
              className="mt-1.5 w-full min-h-[36px] py-1.5 rounded-[6px] text-[11px] font-semibold bg-brand text-white hover:bg-brand-d disabled:opacity-60"
            >
              Mark {firstName(displayName)} as winner
            </button>
          ) : null}
        </div>
      </AthleteSlot>
    );
  }

  const cardWidth = compact ? "w-full max-w-[232px] sm:w-[232px]" : "w-full max-w-[280px]";

  return (
    <div
      className={`${cardWidth} shrink-0 border border-line rounded-[10px] bg-card overflow-hidden ${
        isLive ? "ring-2 ring-red/25" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface/60 border-b border-line2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-brand">{label}</span>
        {isLive ? (
          <span className="text-[10px] font-semibold text-red">Live</span>
        ) : isCompleted ? (
          <span className="text-[10px] font-semibold text-brand">Done</span>
        ) : (
          <span className="text-[10px] text-muted">Scheduled</span>
        )}
      </div>

      <div className="p-2 space-y-1">
        {singleAthlete ? (
          <AthleteRow side="a" name={match.playerAName} />
        ) : (
          <>
            <AthleteRow side="a" name={match.playerAName} />
            <div className="text-[10px] text-muted text-center">vs</div>
            <AthleteRow side="b" name={match.playerBName} />
          </>
        )}
      </div>

      {error ? (
        <p className="px-3 pb-2 text-[10px] text-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
