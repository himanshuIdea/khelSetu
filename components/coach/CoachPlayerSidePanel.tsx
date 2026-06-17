import { UsersIcon } from "@/components/academy/icons";
import {
  Avatar,
  EmptyState,
  Pill,
  SidePanel,
} from "@/components/academy/shared";
import type { PlayerDetail } from "@/lib/repositories/types";

const SURFACE_CLASS = "w-full min-w-0";

export function CoachPlayerSidePanelSkeleton() {
  return (
    <SidePanel>
      <div
        className={`${SURFACE_CLASS} bg-card border border-line lg:border-r-0 rounded-(--radius) lg:rounded-l-(--radius) shadow-card px-4 sm:px-[22px] py-6 animate-pulse`}
        aria-busy
        aria-label="Loading player profile"
      >
        <div className="flex flex-col items-center pb-[18px] border-b border-line2">
          <div className="w-16 h-16 rounded-full bg-line2" />
          <div className="h-5 w-32 bg-line2 rounded mt-3" />
          <div className="h-3 w-40 bg-line2 rounded mt-2" />
        </div>
      </div>
    </SidePanel>
  );
}

export function CoachPlayerSidePanelEmpty({ hasPlayers }: { hasPlayers: boolean }) {
  return (
    <SidePanel>
      <EmptyState
        compact
        className={`${SURFACE_CLASS} lg:border-r-0 lg:rounded-l-(--radius)`}
        icon={<UsersIcon className="w-5 h-5" />}
        title="No player selected"
        description={
          !hasPlayers
            ? "No players are assigned to your batches yet."
            : "Select a player from the list to view their profile summary here."
        }
      />
    </SidePanel>
  );
}

export function CoachPlayerSidePanelContent({ player }: { player: PlayerDetail }) {
  return (
    <SidePanel>
      <div
        className={`${SURFACE_CLASS} bg-card border border-line lg:border-r-0 rounded-(--radius) lg:rounded-l-(--radius) shadow-card px-4 sm:px-[22px] py-6`}
      >
        <div className="flex flex-col items-center text-center pb-[18px] border-b border-line2">
          <Avatar
            initials={player.initials}
            color="linear-gradient(135deg, #FF6B2C, #FF9152)"
            size="lg"
          />
          <div className="text-[17px] font-bold text-ink mt-3">{player.name}</div>
          <div className="text-[11.5px] text-muted">
            {player.id} · {player.sport}
          </div>
          <div className="flex flex-wrap justify-center gap-[7px] mt-[11px]">
            <Pill variant={player.status === "On hold" ? "amber" : "green"}>
              <span
                className={`w-[7px] h-[7px] rounded-full ${player.status === "On hold" ? "bg-amber" : "bg-green"}`}
              />
              {player.status}
            </Pill>
            <Pill variant="brand">{player.batch}</Pill>
          </div>
        </div>

        <div className="flex justify-between py-4 border-b border-line2">
          {[
            { v: player.rating, l: "Rating" },
            { v: player.attendance, l: "Attendance" },
            { v: player.boutsWon, l: "Bouts won" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-[19px] font-bold text-ink">{s.v}</div>
              <div className="text-[11.5px] text-muted">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="py-4 text-[12.5px] text-text space-y-[11px]">
          <div className="flex justify-between">
            <span className="text-muted">Joined</span>
            <b>{player.joined}</b>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Coach</span>
            {player.coachUnassigned ? (
              <Pill variant="grey">Unassigned</Pill>
            ) : (
              <b>{player.coach}</b>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Status</span>
            <Pill variant={player.status === "On hold" ? "amber" : "green"}>{player.status}</Pill>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
