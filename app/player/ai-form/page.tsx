import Link from "next/link";
import { BoltIcon, CheckIcon, VideoIcon } from "@/components/academy/icons";
import { Pill } from "@/components/academy/shared";
import { PlayerScreen } from "@/components/player/PlayerScreen";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

const aspects = [
  { label: "Squat depth", status: "green" as const, statusLabel: "Good" },
  { label: "Knee tracking", status: "green" as const, statusLabel: "Good" },
  { label: "Bar path", status: "green" as const, statusLabel: "Good" },
  { label: "Hip–chest timing", status: "red" as const, statusLabel: "Needs work" },
];

export default function PlayerAiFormPage() {
  return (
    <PlayerScreen>
      <div className="flex items-center gap-3 px-[18px] pb-3.5 shrink-0">
        <Link href="/player/drills" className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink">
          <BackIcon />
        </Link>
        <div className="text-[17px] font-bold text-ink">AI Form Check</div>
        <div className="flex-1" />
        <Pill variant="brand" className="text-[10px]"><BoltIcon className="w-[11px] h-[11px]" />AI</Pill>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 [-webkit-overflow-scrolling:touch]">
        <div className="text-[13px] font-bold text-ink mx-1 mb-1">Back Squat · 3 × 8</div>
        <div className="text-[11.5px] text-muted mx-1 mb-[11px]">AI compared your set against Coach Naveen&apos;s reference</div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 rounded-[14px] overflow-hidden relative h-[188px] bg-linear-to-b from-[#10202c] to-[#0a151d]">
            <span className="absolute top-2 left-2 z-10 text-[9.5px] font-extrabold tracking-[0.5px] text-[#37C6FF]">COACH</span>
            <span className="absolute top-2 right-2 z-10 bg-[#12B886]/92 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-[6px]">REFERENCE</span>
            <span className="absolute bottom-2 left-2 right-2 z-10 text-center text-[9px] font-bold text-white bg-[#12B886]/85 px-1.5 py-1 rounded-[6px] leading-tight">
              Chest & hips rise together
            </span>
          </div>
          <div className="flex-1 rounded-[14px] overflow-hidden relative h-[188px] bg-linear-to-b from-[#10202c] to-[#0a151d]">
            <span className="absolute top-2 left-2 z-10 text-[9.5px] font-extrabold tracking-[0.5px] text-[#5DF08A]">YOU</span>
            <span className="absolute bottom-2 left-2 right-2 z-10 text-center text-[9px] font-bold text-white bg-red/90 px-1.5 py-1 rounded-[6px] leading-tight">
              Hips rise faster than chest
            </span>
          </div>
        </div>

        <div className="bg-card border border-line rounded-[18px] flex items-center gap-3.5 p-4 mb-3">
          <svg width="62" height="62" viewBox="0 0 80 80" className="shrink-0">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#EEF1F7" strokeWidth="9" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#F5A623" strokeWidth="9" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="46" transform="rotate(-90 40 40)" />
            <text x="40" y="45" textAnchor="middle" fontSize="19" fontWeight="800" fill="#0E1B33" fontFamily="Poppins">77%</text>
          </svg>
          <div>
            <div className="text-sm font-bold text-ink">Form match: 77%</div>
            <div className="text-[11.5px] text-muted leading-snug mt-0.5">
              Close to the coach&apos;s pattern — one timing fault to fix on the way up.
            </div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-[18px] p-[15px] mb-3">
          <div className="text-[12.5px] font-bold text-ink mb-[11px]">What the AI checked</div>
          {aspects.map((a, i) => (
            <div key={a.label} className={`flex justify-between items-center ${i < aspects.length - 1 ? "mb-2" : ""}`}>
              <span className="text-[12.5px] text-text">{a.label}</span>
              <Pill variant={a.status} className="text-[10px]">
                {a.status === "green" && <CheckIcon className="w-2.5 h-2.5" />}
                {a.statusLabel}
              </Pill>
            </div>
          ))}
        </div>

        <div className="bg-brand-soft border border-[#FFD9C5] rounded-[18px] p-[15px] flex gap-[11px] items-start mb-3">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-brand flex items-center justify-center shrink-0">
            <BoltIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[12.5px] font-bold text-brand-d mb-0.5">AI coaching tip</div>
            <div className="text-xs text-[#7a4a30] leading-snug">
              Your hips rise faster than your chest — drive your chest up and through the bar as you stand. Keep them moving together, like the coach&apos;s rep.
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex gap-2 items-center px-4 py-3 bg-card border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex-1 bg-surface rounded-[22px] px-4 py-[11px] text-[12.5px] text-muted2">
          Re-record · or send to Coach Naveen…
        </div>
        <button type="button" className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
          <VideoIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
    </PlayerScreen>
  );
}
