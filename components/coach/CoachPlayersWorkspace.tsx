"use client";

import { useState } from "react";
import { CoachPlayerSidePanelClient } from "@/components/coach/CoachPlayerSidePanelClient";
import { CoachPlayersListSection } from "@/components/coach/CoachPlayersListSection";
import { SplitLayout } from "@/components/academy/shared";
import type { CoachPlayerFormOptions } from "@/lib/repositories/players";
import type { Player } from "@/lib/repositories/types";

type CoachPlayersWorkspaceProps = {
  academyId: string;
  players: Player[];
  formOptions: CoachPlayerFormOptions;
  initialBatchId?: string;
  children?: React.ReactNode;
};

export function CoachPlayersWorkspace({
  academyId,
  players,
  formOptions,
  initialBatchId,
  children,
}: CoachPlayersWorkspaceProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  return (
    <SplitLayout className="min-w-0 w-full">
      <div className="flex-1 min-w-0 w-full">
        {children}
        <CoachPlayersListSection
          players={players}
          formOptions={formOptions}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          initialBatchId={initialBatchId}
        />
      </div>

      <CoachPlayerSidePanelClient
        academyId={academyId}
        selectedPlayerId={selectedPlayerId}
        hasPlayers={players.length > 0}
      />
    </SplitLayout>
  );
}
