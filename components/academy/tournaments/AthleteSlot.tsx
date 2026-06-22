"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useOptionalTournamentDrag } from "@/components/academy/tournaments/TournamentDragContext";
import { api, ApiError } from "@/lib/api";
import {
  isDraggableAthlete,
  isOpenAthleteSlot,
  isPlaceholderAthleteName,
} from "@/lib/tournament-match-slots";

type AthleteSlotProps = {
  tournamentId: string;
  matchId: string;
  side: "a" | "b";
  playerId?: string | null;
  playerName: string | null;
  matchCompleted: boolean;
  children: ReactNode;
};

export function AthleteSlot({
  tournamentId,
  matchId,
  side,
  playerId,
  playerName,
  matchCompleted,
  children,
}: AthleteSlotProps) {
  const router = useRouter();
  const drag = useOptionalTournamentDrag();

  const displayName = playerName?.trim() || "TBD";
  const canDrag =
    drag != null && isDraggableAthlete(playerId, playerName, matchCompleted);
  const canDrop =
    drag != null &&
    !matchCompleted &&
    isOpenAthleteSlot(playerId, playerName) &&
    !(drag.dragPayload?.sourceMatchId === matchId && drag.dragPayload.sourceSide === side);

  function handleDragStart(event: React.DragEvent) {
    if (!canDrag || !drag) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", displayName);
    drag.setDragPayload({
      playerId: playerId ?? null,
      playerName: displayName,
      sourceMatchId: matchId,
      sourceSide: side,
    });
  }

  function handleDragEnd() {
    drag?.clearDrag();
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    if (!canDrop || !drag?.dragPayload) return;

    try {
      await api.tournaments.moveAthlete(tournamentId, {
        from: {
          matchId: drag.dragPayload.sourceMatchId,
          side: drag.dragPayload.sourceSide,
        },
        to: { matchId, side },
      });
      drag.clearDrag();
      router.refresh();
    } catch (err) {
      drag.clearDrag();
      if (err instanceof ApiError) {
        console.error(err.message);
      }
    }
  }

  function handleDragOver(event: React.DragEvent) {
    if (!canDrop || !drag?.dragPayload) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  const showDropHint = canDrop && drag?.dragPayload != null;

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`rounded-[8px] transition-colors ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      } ${showDropHint ? "ring-2 ring-dashed ring-brand/50 bg-brand-soft/20" : ""}`}
      title={
        canDrag
          ? "Drag to an empty slot"
          : isPlaceholderAthleteName(playerName)
            ? "Drop athlete here"
            : undefined
      }
    >
      {children}
    </div>
  );
}
