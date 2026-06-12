import { SearchIcon } from "@/components/academy/icons";
import { Avatar, Pill } from "@/components/academy/shared";
import { PhoneShell } from "@/components/mobile/PhoneShell";

const trending = [
  { initials: "PD", color: "#7C5CFC", name: "Priya Dahiya", sport: "Boxing", district: "Bhiwani" },
  { initials: "RS", color: "#FF6B2C", name: "Rohit Sangwan", sport: "Wrestling", district: "Sonipat" },
  { initials: "SM", color: "#12B886", name: "Sahil Malik", sport: "Athletics", district: "Hisar" },
];

const topics = ["State trials", "Drill challenges", "Coach tips", "Tournament highlights"];

export default function MobileExplorePage() {
  return (
    <PhoneShell>
      <div className="px-[18px] pb-3 shrink-0">
        <div className="text-[17px] font-bold text-ink mb-3">Explore</div>
        <div className="flex items-center gap-2 bg-card border border-line rounded-[11px] px-3 py-2.5 text-muted2">
          <SearchIcon />
          <span className="text-[13px]">Search athletes, drills, coaches…</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="text-xs font-bold text-muted uppercase tracking-[0.6px] mb-2">Trending topics</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((t, i) => (
            <Pill key={t} variant={i === 0 ? "brand" : "grey"} className="px-3 py-2">{t}</Pill>
          ))}
        </div>

        <div className="text-xs font-bold text-muted uppercase tracking-[0.6px] mb-2">Athletes to follow</div>
        {trending.map((a) => (
          <div key={a.name} className="bg-card border border-line rounded-[18px] p-3 mb-2.5 flex items-center gap-2.5">
            <Avatar initials={a.initials} color={a.color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[13px] text-ink">{a.name}</div>
              <div className="text-[11.5px] text-muted">{a.sport} · {a.district}</div>
            </div>
            <button type="button" className="text-[12px] font-semibold text-brand px-3 py-1.5 rounded-lg bg-brand-soft">
              Follow
            </button>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
