import type { Coach } from "@/lib/repositories/types";
import { ShieldIcon, StarIcon } from "./icons";

type CoachCardProps = {
  coach: Coach;
  onClick?: () => void;
};

function BadgePill({ coach }: { coach: Coach }) {
  if (coach.badge === "in-review") {
    return (
      <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-1 rounded-full bg-surface text-[#62708C]">
        {coach.badgeLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-1 rounded-full bg-blue-soft text-[#2756D8]">
      <ShieldIcon />
      {coach.badgeLabel}
    </span>
  );
}

export function CoachCard({ coach, onClick }: CoachCardProps) {
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`bg-card border border-line rounded-(--radius) p-[18px] shadow-card text-left w-full transition-colors ${
        interactive
          ? "cursor-pointer hover:border-brand/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          : ""
      }`}
    >
      <div className="flex gap-[13px] items-center mb-3.5">
        <div
          className="w-12 h-12 rounded-[13px] flex items-center justify-center font-bold text-base text-white shrink-0"
          style={{ backgroundColor: coach.avatarColor }}
        >
          {coach.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14.5px] text-ink">{coach.name}</div>
          <div className="text-[11.5px] text-muted">{coach.role}</div>
        </div>
        <BadgePill coach={coach} />
      </div>

      <div className="flex justify-between pt-[13px] border-t border-line2">
        <div>
          <div className="font-bold text-[15px] text-ink">{coach.players}</div>
          <div className="text-[11.5px] text-muted">Players</div>
        </div>
        <div>
          <div className="font-bold text-[15px] text-ink flex items-center gap-[3px]">
            <StarIcon className="text-amber" />
            {coach.rating > 0 ? coach.rating.toFixed(1) : "—"}
          </div>
          <div className="text-[11.5px] text-muted">Rating</div>
        </div>
        <div>
          <div className="font-bold text-[15px] text-ink">{coach.drillsPerWeek}</div>
          <div className="text-[11.5px] text-muted">Drills · wk</div>
        </div>
        <div>
          <div className="font-bold text-[15px] text-brand-d">{coach.toReview}</div>
          <div className="text-[11.5px] text-muted">To review</div>
        </div>
      </div>
    </div>
  );
}
