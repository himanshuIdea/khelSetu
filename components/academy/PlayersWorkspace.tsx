"use client";

import { useCallback, useEffect, useState } from "react";
import { PlayerSidePanelClient } from "@/components/academy/PlayerSidePanelClient";
import { PlayersListSection } from "@/components/academy/PlayersListSection";
import { SplitLayout } from "@/components/academy/shared";
import type { PlayerFormOptions } from "@/lib/players";
import type { Player } from "@/lib/repositories/types";

type PlayersWorkspaceProps = {
  academyId: string;
  players: Player[];
  formOptions: PlayerFormOptions;
  children?: React.ReactNode;
};

export function PlayersWorkspace({
  academyId,
  players,
  formOptions,
  children,
}: PlayersWorkspaceProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [listPlayers, setListPlayers] = useState(players);

  useEffect(() => {
    setListPlayers(players);
  }, [players]);

  const handlePlayerRemoved = useCallback((playerId: string) => {
    setListPlayers((current) => current.filter((player) => player.id !== playerId));
    setSelectedPlayerId((current) => (current === playerId ? null : current));
  }, []);

  return (
    <SplitLayout className="min-w-0 w-full">
      <div className="flex-1 min-w-0 w-full lg:pr-[26px]">
        {children}
        <PlayersListSection
          players={listPlayers}
          formOptions={formOptions}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        />
      </div>

      <PlayerSidePanelClient
        academyId={academyId}
        selectedPlayerId={selectedPlayerId}
        hasPlayers={listPlayers.length > 0}
        formOptions={formOptions}
        onPlayerRemoved={handlePlayerRemoved}
      />
    </SplitLayout>
  );
}
