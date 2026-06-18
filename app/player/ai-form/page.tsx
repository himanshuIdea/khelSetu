import { BoltIcon, CheckIcon, VideoIcon } from "@/components/academy/icons";
import { Pill } from "@/components/academy/shared";
import { PlayerBackButton } from "@/components/player/PlayerChrome";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { playerLayout } from "@/lib/player-layout";
import { playerRoutes } from "@/lib/player-nav";

const aspects = [
  { label: "Squat depth", status: "green" as const, statusLabel: "Good" },
  { label: "Knee tracking", status: "green" as const, statusLabel: "Good" },
  { label: "Bar path", status: "green" as const, statusLabel: "Good" },
  { label: "Hip–chest timing", status: "red" as const, statusLabel: "Needs work" },
];

export default function PlayerAiFormPage() {
  return (
    <PlayerScreen>
      <PlayerPageHeader
        leading={<PlayerBackButton href={playerRoutes.drills} label="Back to drills" />}
        title="AI Form Check"
        trailing={
          <Pill variant="brand" className="text-[10px] shrink-0">
            <BoltIcon className="w-[11px] h-[11px]" />
            AI
          </Pill>
        }
      />

      <PlayerScrollBody className="gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-ink">Back Squat · 3 × 8</div>
          <div className="text-[11.5px] text-muted mt-1 leading-relaxed">
            AI compared your set against Coach Naveen&apos;s reference
          </div>
        </div>

        <div className="flex gap-2 sm:gap-2.5 min-w-0">
          <div className="flex-1 min-w-0 rounded-[14px] overflow-hidden relative h-[160px] sm:h-[188px] bg-linear-to-b from-[#10202c] to-[#0a151d]">
            <span className="absolute top-2 left-2 z-10 text-[9.5px] font-extrabold tracking-[0.5px] text-[#37C6FF]">
              COACH
            </span>
            <span className="absolute top-2 right-2 z-10 bg-[#12B886]/92 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-[6px]">
              REFERENCE
            </span>
            <span className="absolute bottom-2 left-2 right-2 z-10 text-center text-[9px] font-bold text-white bg-[#12B886]/85 px-1.5 py-1 rounded-[6px] leading-tight">
              Chest & hips rise together
            </span>
          </div>
          <div className="flex-1 min-w-0 rounded-[14px] overflow-hidden relative h-[160px] sm:h-[188px] bg-linear-to-b from-[#10202c] to-[#0a151d]">
            <span className="absolute top-2 left-2 z-10 text-[9.5px] font-extrabold tracking-[0.5px] text-[#5DF08A]">
              YOU
            </span>
            <span className="absolute bottom-2 left-2 right-2 z-10 text-center text-[9px] font-bold text-white bg-red/90 px-1.5 py-1 rounded-[6px] leading-tight">
              Hips rise faster than chest
            </span>
          </div>
        </div>

        <div className={`${playerLayout.card} flex items-center gap-3.5 p-4 min-w-0`}>
          <svg width="62" height="62" viewBox="0 0 80 80" className="shrink-0" aria-hidden="true">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#EEF1F7" strokeWidth="9" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="#F5A623"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="201"
              strokeDashoffset="46"
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="45" textAnchor="middle" fontSize="19" fontWeight="800" fill="#0E1B33" fontFamily="Poppins">
              77%
            </text>
          </svg>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink">Form match: 77%</div>
            <div className="text-[11.5px] text-muted leading-snug mt-0.5">
              Close to the coach&apos;s pattern — one timing fault to fix on the way up.
            </div>
          </div>
        </div>

        <div className={`${playerLayout.card} p-4 sm:p-[15px] min-w-0`}>
          <div className="text-[12.5px] font-bold text-ink mb-3">What the AI checked</div>
          <div className="space-y-2">
            {aspects.map((aspect) => (
              <div key={aspect.label} className="flex justify-between items-center gap-3 min-w-0">
                <span className="text-[12.5px] text-text truncate">{aspect.label}</span>
                <Pill variant={aspect.status} className="text-[10px] shrink-0">
                  {aspect.status === "green" && <CheckIcon className="w-2.5 h-2.5" />}
                  {aspect.statusLabel}
                </Pill>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-soft border border-[#FFD9C5] rounded-[18px] p-4 sm:p-[15px] flex gap-3 items-start min-w-0">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-brand flex items-center justify-center shrink-0">
            <BoltIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold text-brand-d mb-0.5">AI coaching tip</div>
            <div className="text-xs text-[#7a4a30] leading-snug">
              Your hips rise faster than your chest — drive your chest up and through the bar as you stand.
              Keep them moving together, like the coach&apos;s rep.
            </div>
          </div>
        </div>

        <div className={`${playerLayout.card} flex gap-2 items-center p-3 min-w-0`}>
          <div className="flex-1 min-w-0 bg-surface rounded-[22px] px-4 py-3 text-[12.5px] text-muted2 truncate">
            Re-record · or send to Coach Naveen…
          </div>
          <button
            type="button"
            aria-label="Send video"
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-brand flex items-center justify-center text-white shrink-0"
          >
            <VideoIcon className="w-[18px] h-[18px]" />
          </button>
        </div>
      </PlayerScrollBody>
    </PlayerScreen>
  );
}
