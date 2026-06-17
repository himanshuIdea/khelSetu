import { UpIcon } from "@/components/academy/icons";
import { PlayerScreen } from "@/components/player/PlayerScreen";

function FireIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-brand" fill="currentColor" aria-hidden="true">
      <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-6.867 8.21 8.21 0 003 2.48z" />
    </svg>
  );
}

const skills = [
  { label: "Technique", score: "8.4", percent: 84, color: "#FF6B2C" },
  { label: "Strength", score: "7.8", percent: 78, color: "#12B886" },
  { label: "Speed", score: "7.2", percent: 72, color: "#2F6BFF" },
  { label: "Stamina", score: "7.5", percent: 75, color: "#7C5CFC" },
  { label: "Discipline", score: "9.2", percent: 92, color: "#F5A623" },
];

const stats = [
  { value: "42", label: "Sessions" },
  { value: "94%", label: "Attendance" },
  { value: "38", label: "Drills done" },
  { value: "12", label: "Bouts won" },
];

export default function PlayerProfilePage() {
  return (
    <PlayerScreen>
      <div className="flex items-center justify-between px-[18px] pb-3.5 shrink-0">
        <div className="text-[17px] font-bold text-ink">My Performance</div>
        <div className="flex bg-card border border-line rounded-[11px] p-[3px]">
          <span className="text-xs font-semibold px-3.5 py-[7px] rounded-lg text-muted">Month</span>
          <span className="text-xs font-semibold px-3.5 py-[7px] rounded-lg bg-ink text-white">Season</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="bg-linear-to-br from-ink to-ink3 rounded-[20px] p-[18px] text-white mb-3 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-brand to-[#FF9152] flex items-center justify-center text-xl font-bold shrink-0">RS</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold">Rohit Sangwan</div>
            <div className="text-xs text-[#A9B5D1]">Wrestling · 65 kg · Sub-junior</div>
            <div className="inline-flex items-center gap-1 bg-brand/18 text-[#FFB68F] text-[11px] font-semibold px-2.5 py-[5px] rounded-[20px] mt-[7px]">
              <FireIcon />
              23-day training streak
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[30px] font-bold leading-none">7.8</div>
            <div className="text-[10.5px] text-[#A9B5D1]">overall</div>
            <div className="inline-flex items-center gap-0.5 text-[#34D399] text-[11px] font-semibold mt-0.5">
              <UpIcon className="w-3 h-3" />
              +0.6
            </div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-[18px] p-[15px] mb-3">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[13.5px] font-bold text-ink">Coach rating trend</div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-soft text-[#0E9B72] inline-flex items-center gap-1">
              <UpIcon className="w-[11px] h-[11px]" />
              Improving
            </span>
          </div>
          <div className="text-[11px] text-muted mb-2">Last 8 weeks</div>
          <svg viewBox="0 0 320 116" width="100%" height="116">
            <g stroke="#EDF0F6" strokeWidth="1">
              <line x1="0" y1="20" x2="320" y2="20" />
              <line x1="0" y1="58" x2="320" y2="58" />
              <line x1="0" y1="96" x2="320" y2="96" />
            </g>
            <defs>
              <linearGradient id="profileArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF6B2C" stopOpacity="0.25" />
                <stop offset="1" stopColor="#FF6B2C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M6 86 L51 80 L96 84 L141 66 L186 58 L231 44 L276 38 L314 26 L314 96 L6 96 Z" fill="url(#profileArea)" />
            <path d="M6 86 L51 80 L96 84 L141 66 L186 58 L231 44 L276 38 L314 26" fill="none" stroke="#FF6B2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="314" cy="26" r="5" fill="#FF6B2C" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>

        <div className="bg-card border border-line rounded-[18px] p-[15px] mb-3">
          <div className="text-[13.5px] font-bold text-ink mb-3">Skill breakdown</div>
          {skills.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
              <span className="text-xs font-medium text-text w-16 shrink-0">{s.label}</span>
              <div className="flex-1 h-[18px] bg-line2 rounded-md overflow-hidden">
                <div className="h-full rounded-md" style={{ width: `${s.percent}%`, background: s.color }} />
              </div>
              <span className="text-[11.5px] font-semibold text-text w-7 text-right shrink-0">{s.score}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border border-line rounded-[13px] py-3 px-2 text-center">
              <div className="text-lg font-bold text-ink">{s.value}</div>
              <div className="text-[9.5px] text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </PlayerScreen>
  );
}
