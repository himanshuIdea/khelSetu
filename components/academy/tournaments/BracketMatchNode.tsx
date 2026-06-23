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

type BracketMatchNodeProps = {
  tournamentId: string;
  match: DbBracketMatch;
  advanceWinner?: boolean;
};

export function BracketMatchNode({
  tournamentId,
  match,
  advanceWinner = true,
}: BracketMatchNodeProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = match.matchLabel?.trim() || resolveMatchDisplayLabel(match);
  const winnerSide = inferWinnerSide(match);
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed" || winnerSide != null;

  async function markWinner(side: "a" | "b") {
    if (saving || isCompleted) return;
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

  function PlayerSlot({ side, name }: { side: "a" | "b"; name: string | null }) {
    const displayName = name?.trim() || "TBD";
    const isWinner = winnerSide === side;
    const isLoser = isCompleted && !isWinner && winnerSide != null;
    const canPick = !isCompleted && displayName !== "TBD" && displayName !== "BYE";
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
        <div
          className={`px-2.5 py-2 ${
            isWinner
              ? "bg-brand-soft border border-brand/30 rounded-[8px]"
              : isLoser
                ? "opacity-55"
                : ""
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
              style={{ background: avatarColor(displayName) }}
            >
              {getInitials(displayName).slice(0, 2)}
            </span>
            <span
              className="flex-1 min-w-0 text-[13px] font-medium text-ink truncate whitespace-nowrap"
              title={displayName}
            >
              {displayName}
            </span>
            {isWinner ? (
              <TrophyIcon className="w-4 h-4 text-brand shrink-0" aria-hidden />
            ) : isCompleted && score != null ? (
              <span className="text-[12px] font-bold text-ink shrink-0">{score}</span>
            ) : null}
          </div>

          {canPick ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void markWinner(side)}
              className="mt-2 w-full min-h-[36px] px-3 py-1.5 rounded-[6px] text-[11px] font-semibold bg-brand text-white hover:bg-brand-d disabled:opacity-60"
            >
              Mark {firstName(displayName)} as winner
            </button>
          ) : null}
        </div>
      </AthleteSlot>
    );
  }

  return (
    <div
      className={`w-full max-w-[232px] sm:w-[232px] shrink-0 rounded-[10px] border bg-card overflow-hidden ${
        isLive ? "border-red shadow-[0_0_0_2px_rgba(239,68,68,0.15)]" : "border-line shadow-card/30"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${
          isLive ? "bg-red/5 border-red/20" : "bg-surface/80 border-line2"
        }`}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-brand">{label}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red">
            <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
            Live
          </span>
        ) : isCompleted ? (
          <span className="text-[10px] font-semibold text-brand">Completed</span>
        ) : (
          <span className="text-[10px] text-muted">Scheduled</span>
        )}
      </div>

      <div className="p-2 space-y-1">
        <PlayerSlot side="a" name={match.playerAName} />
        <div className="text-[10px] text-muted text-center leading-none py-0.5">vs</div>
        <PlayerSlot side="b" name={match.playerBName} />
      </div>

      {error ? (
        <p className="px-3 pb-2 text-[10px] text-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
