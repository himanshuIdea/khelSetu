import { UsersIcon } from "@/components/academy/icons";
import {
  Avatar,
  EmptyState,
  Pill,
  SidePanel,
} from "@/components/academy/shared";
import type { PlayerDetail } from "@/lib/repositories/types";

const PLAYER_SIDE_PANEL_SURFACE_CLASS = "w-full min-w-0";

type PlayerSidePanelEmptyProps = {
  hasPlayers: boolean;
};

type PlayerSidePanelContentProps = {
  player: PlayerDetail;
  onViewProfile?: () => void;
  onDeboard?: () => void;
};

export function PlayerSidePanelSkeleton() {
  return (
    <SidePanel>
      <div
        className={`${PLAYER_SIDE_PANEL_SURFACE_CLASS} bg-card border border-line lg:border-r-0 rounded-(--radius) lg:rounded-l-(--radius) shadow-card px-4 sm:px-[22px] py-6 animate-pulse`}
        aria-busy
        aria-label="Loading player profile"
      >
        <div className="flex flex-col items-center pb-[18px] border-b border-line2">
          <div className="w-16 h-16 rounded-full bg-line2" />
          <div className="h-5 w-32 bg-line2 rounded mt-3" />
          <div className="h-3 w-40 bg-line2 rounded mt-2" />
          <div className="flex gap-2 mt-3">
            <div className="h-6 w-16 bg-line2 rounded-full" />
            <div className="h-6 w-20 bg-line2 rounded-full" />
          </div>
        </div>
        <div className="flex justify-between py-4 border-b border-line2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-5 w-10 bg-line2 rounded mx-auto" />
              <div className="h-3 w-14 bg-line2 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-20 bg-line2 rounded" />
              <div className="h-3 w-24 bg-line2 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-2 mt-1">
          <div className="h-10 bg-line2 rounded-[10px]" />
          <div className="h-10 bg-line2 rounded-[10px]" />
          <div className="h-10 bg-line2 rounded-[10px]" />
        </div>
      </div>
    </SidePanel>
  );
}

export function PlayerSidePanelEmpty({ hasPlayers }: PlayerSidePanelEmptyProps) {
  return (
    <SidePanel>
      <EmptyState
        compact
        className={`${PLAYER_SIDE_PANEL_SURFACE_CLASS} lg:border-r-0 lg:rounded-l-(--radius)`}
        icon={<UsersIcon className="w-5 h-5" />}
        title="No player selected"
        description={
          !hasPlayers
            ? "Add a player to preview their profile, fees and attendance here."
            : "Select a player from the list to view their profile summary here."
        }
      />
    </SidePanel>
  );
}

export function PlayerSidePanelContent({
  player,
  onViewProfile,
  onDeboard,
}: PlayerSidePanelContentProps) {
  return (
    <SidePanel>
      <div
        className={`${PLAYER_SIDE_PANEL_SURFACE_CLASS} bg-card border border-line lg:border-r-0 rounded-(--radius) lg:rounded-l-(--radius) shadow-card px-4 sm:px-[22px] py-6`}
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
          <div className="flex justify-between">
            <span className="text-muted">Monthly fee</span>
            <b>{player.monthlyFee}</b>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Fee status</span>
            <Pill variant={player.feeStatus.startsWith("Paid") ? "green" : "amber"}>
              {player.feeStatus}
            </Pill>
          </div>
        </div>

        <div className="flex flex-col gap-[9px] mt-1">
          <button
            type="button"
            onClick={onViewProfile}
            className="w-full inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
          >
            View full profile
          </button>
          <button
            type="button"
            className="w-full inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
          >
            Record fee payment
          </button>
          <button
            type="button"
            onClick={onDeboard}
            className="w-full inline-flex items-center justify-center bg-card text-red font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-[#F6D4D4]"
          >
            Deboard player
          </button>
        </div>
      </div>
    </SidePanel>
  );
}
