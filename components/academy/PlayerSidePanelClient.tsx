"use client";

import { useEffect, useState } from "react";
import { EditPlayerModal } from "@/components/academy/EditPlayerModal";
import { PlayerProfileModal } from "@/components/academy/PlayerProfileModal";
import {
  PlayerSidePanelContent,
  PlayerSidePanelEmpty,
  PlayerSidePanelSkeleton,
} from "@/components/academy/PlayerSidePanel";
import { RemovePlayerDialog } from "@/components/academy/RemovePlayerDialog";
import { api } from "@/lib/api";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import type { PlayerFormOptions } from "@/lib/players";
import type { PlayerDetail } from "@/lib/repositories/types";

type PlayerSidePanelClientProps = {
  academyId: string;
  selectedPlayerId: string | null;
  hasPlayers: boolean;
  formOptions: PlayerFormOptions;
  onPlayerRemoved?: (playerId: string) => void;
};

export function PlayerSidePanelClient({
  academyId,
  selectedPlayerId,
  hasPlayers,
  formOptions,
  onPlayerRemoved,
}: PlayerSidePanelClientProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    if (!selectedPlayerId) {
      setPlayer(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api.players
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

  useEffect(() => {
    setProfileOpen(false);
    setEditOpen(false);
    setRemoveOpen(false);
  }, [selectedPlayerId]);

  function handleEditFromProfile() {
    setProfileOpen(false);
    setEditOpen(true);
  }

  if (!selectedPlayerId) {
    if (!isDesktop) return null;
    return <PlayerSidePanelEmpty hasPlayers={hasPlayers} />;
  }

  if (isLoading) {
    return <PlayerSidePanelSkeleton />;
  }

  if (!player) {
    return <PlayerSidePanelEmpty hasPlayers={hasPlayers} />;
  }

  return (
    <>
      <PlayerProfileModal
        player={player}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onEdit={handleEditFromProfile}
      />

      <EditPlayerModal
        academyId={academyId}
        externalId={selectedPlayerId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        formOptions={formOptions}
      />

      <RemovePlayerDialog
        academyId={academyId}
        playerId={selectedPlayerId}
        playerName={player.name}
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onRemoved={(playerId) => {
          onPlayerRemoved?.(playerId);
        }}
      />

      <PlayerSidePanelContent
        player={player}
        onViewProfile={() => setProfileOpen(true)}
        onDeboard={() => setRemoveOpen(true)}
      />
    </>
  );
}
