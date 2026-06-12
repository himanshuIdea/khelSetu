import Link from "next/link";
import { CheckIcon, StarIcon, VideoIcon } from "@/components/academy/icons";
import { Avatar, Pill } from "@/components/academy/shared";
import { PhoneShell } from "@/components/mobile/PhoneShell";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink ml-0.5" fill="currentColor" aria-hidden="true">
      <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  );
}

const criteria = [
  { label: "Technique", score: "8/10", width: 80 },
  { label: "Speed", score: "7/10", width: 70 },
  { label: "Form & finish", score: "7/10", width: 70 },
];

export default function MobileDrillsPage() {
  return (
    <PhoneShell showTabBar={false}>
      <div className="flex items-center gap-3 px-[18px] pb-3.5 shrink-0">
        <Link href="/mobile/home" className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink">
          <BackIcon />
        </Link>
        <div className="text-[17px] font-bold text-ink">Today&apos;s Drill</div>
        <Link href="/mobile/ai-form" className="ml-auto text-[11px] font-semibold text-brand">
          AI Form Check →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="bg-card border border-line rounded-[18px] p-[15px] mb-3">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar initials="NK" color="#FF6B2C" size="sm" />
            <div className="flex-1">
              <div className="font-semibold text-[13.5px] text-ink">Coach Naveen Kadyan</div>
              <div className="text-[11.5px] text-muted">Wrestling · posted 8:00 AM</div>
            </div>
            <Pill variant="grey" className="text-[10px]">Due today</Pill>
          </div>
          <div className="text-base font-bold text-ink mb-1">Single-leg takedown · 3 × 10</div>
          <p className="text-[12.5px] text-muted leading-relaxed mb-3">
            Focus on a clean level change and keep your back straight through the finish.
          </p>
          <div className="h-[120px] rounded-[13px] relative flex items-center justify-center overflow-hidden bg-linear-to-br from-ink to-ink3">
            <span className="absolute top-3 left-3 text-[10px] font-bold bg-white/15 text-white px-2.5 py-1 rounded-[7px]">COACH REFERENCE</span>
            <div className="w-14 h-14 rounded-full bg-white/92 flex items-center justify-center">
              <PlayIcon />
            </div>
            <span className="absolute bottom-3 right-3 bg-ink/78 text-white text-[11px] font-semibold px-2 py-1 rounded-[7px]">0:35</span>
          </div>
        </div>

        <div className="text-xs font-bold text-muted uppercase tracking-[0.6px] mx-1 mb-2.5">Your submission</div>
        <div className="bg-card border border-line rounded-[18px] p-[13px] mb-3">
          <div className="flex items-center gap-[11px]">
            <div className="w-[58px] h-[42px] rounded-[9px] bg-linear-to-br from-[#7a2d12] to-brand flex items-center justify-center shrink-0">
              <VideoIcon className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[13px] text-ink">my_takedown_set.mp4</div>
              <div className="text-[11.5px] text-muted">Submitted 8:42 AM · 30 reps logged</div>
            </div>
            <Pill variant="green"><CheckIcon />Reviewed</Pill>
          </div>
        </div>

        <div className="bg-brand-soft border border-[#FFD9C5] rounded-[18px] p-[15px] mb-3">
          <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar initials="NK" color="#FF6B2C" size="sm" className="!w-[30px] !h-[30px] !text-[11px]" />
            <div className="text-[12.5px] font-semibold text-ink">Coach feedback</div>
            <div className="flex-1" />
            <div className="flex items-center gap-1 bg-card px-[11px] py-[5px] rounded-[20px]">
              <StarIcon className="text-amber" />
              <b className="text-[13px] text-ink">7.5</b>
              <span className="text-[10px] text-muted">/10</span>
            </div>
          </div>
          <p className="text-[12.5px] text-[#7a4a30] leading-relaxed mb-3">
            Good level change and explosive entry. Keep your back straighter on the finish and drive through the hips.
          </p>
          {criteria.map((c) => (
            <div key={c.label} className="mb-[11px] last:mb-0">
              <div className="flex justify-between text-[12.5px] mb-1.5">
                <b className="text-ink">{c.label}</b>
                <span className="text-brand-d font-bold">{c.score}</span>
              </div>
              <div className="h-[7px] rounded-[5px] bg-surface overflow-hidden">
                <div className="h-full rounded-[5px] bg-brand" style={{ width: `${c.width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 flex gap-2 items-center px-4 py-3 bg-card border-t border-line">
        <div className="flex-1 bg-surface rounded-[22px] px-4 py-[11px] text-[12.5px] text-muted2">
          Reply to Coach Naveen…
        </div>
        <button type="button" className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
          →
        </button>
      </div>
    </PhoneShell>
  );
}
