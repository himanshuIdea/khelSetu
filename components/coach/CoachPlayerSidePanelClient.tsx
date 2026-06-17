"use client";

import { useEffect, useState } from "react";
import {
  CoachPlayerSidePanelContent,
  CoachPlayerSidePanelEmpty,
  CoachPlayerSidePanelSkeleton,
} from "@/components/coach/CoachPlayerSidePanel";
import { api } from "@/lib/api";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

type CoachPlayerSidePanelClientProps = {
  academyId: string;
  selectedPlayerId: string | null;
  hasPlayers: boolean;
};

export function CoachPlayerSidePanelClient({
  academyId,
  selectedPlayerId,
  hasPlayers,
}: CoachPlayerSidePanelClientProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [player, setPlayer] = useState<Awaited<ReturnType<typeof api.coach.players.detail>> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedPlayerId) {
      setPlayer(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api.coach.players
      .detail(academyId, selectedPlayerId)
      .then((detail) => {
        if (cancelled) return;
        setPlayer(detail);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPlayer(null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [academyId, selectedPlayerId]);

  if (!selectedPlayerId) {
    if (!isDesktop) return null;
    return <CoachPlayerSidePanelEmpty hasPlayers={hasPlayers} />;
  }

  if (isLoading) {
    return <CoachPlayerSidePanelSkeleton />;
  }

  if (!player) {
    return <CoachPlayerSidePanelEmpty hasPlayers={hasPlayers} />;
  }

  return <CoachPlayerSidePanelContent player={player} />;
}
