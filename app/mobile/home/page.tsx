import { BellIcon, CheckIcon, SearchIcon } from "@/components/academy/icons";
import { Avatar, Pill } from "@/components/academy/shared";
import { PhoneShell } from "@/components/mobile/PhoneShell";

const categories = ["All", "Wrestling", "Boxing", "Kabaddi", "Athletics"];

const posts = [
  {
    initials: "PD",
    color: "#7C5CFC",
    name: "Priya Dahiya",
    meta: "Boxing · Bhiwani · 2h",
    sport: "BOXING",
    gradient: "linear-gradient(135deg,#3a2a6b,#7C5CFC)",
    duration: "0:48",
    caption: "Morning pad-work session.",
    detail: "Working on the jab–cross–hook combo for the state trials next week.",
    likes: "1.2k",
    comments: "86",
    liked: true,
  },
  {
    initials: "RS",
    color: "#FF6B2C",
    name: "Rohit Sangwan",
    meta: "Wrestling · Sonipat · 5h",
    sport: "WRESTLING",
    gradient: "linear-gradient(135deg,#7a2d12,#FF6B2C)",
    duration: "1:12",
    caption: "New personal best on the bridge hold!",
    detail: "3 months of grind paying off.",
    likes: "934",
    comments: "52",
    liked: false,
  },
];

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-ink ml-0.5" fill="currentColor" aria-hidden="true">
      <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  );
}

export default function MobileHomePage() {
  return (
    <PhoneShell>
      <div className="flex items-center px-[18px] pb-3 gap-3 shrink-0">
        <div className="text-[21px] font-bold text-ink tracking-[-0.4px]">
          Khel<span className="text-brand">Setu</span>
        </div>
        <div className="flex-1" />
        <button type="button" className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-muted">
          <SearchIcon />
        </button>
        <button type="button" className="relative w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-muted">
          <BellIcon />
          <span className="absolute top-[9px] right-2.5 w-[7px] h-[7px] rounded-full bg-brand border-2 border-card" />
        </button>
      </div>

      <div className="flex gap-2 px-[18px] pb-3 overflow-x-auto shrink-0">
        {categories.map((c, i) => (
          <span
            key={c}
            className={`text-[12.5px] font-semibold px-[15px] py-2 rounded-[20px] whitespace-nowrap shrink-0 ${
              i === 0 ? "bg-ink text-white" : "bg-card border border-line text-muted"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {posts.map((post) => (
          <article key={post.name} className="bg-card border border-line rounded-[18px] mb-3.5 overflow-hidden">
            <div className="flex items-center gap-2.5 p-[13px] pb-3">
              <Avatar initials={post.initials} color={post.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13.5px] text-ink flex items-center gap-1">
                  {post.name}
                  <span className="w-[15px] h-[15px] rounded-full bg-blue flex items-center justify-center">
                    <CheckIcon className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
                <div className="text-[11.5px] text-muted">{post.meta}</div>
              </div>
              <Pill variant="brand" className="text-[10px]">Coach-verified</Pill>
            </div>
            <div className="h-[208px] relative flex items-center justify-center" style={{ background: post.gradient }}>
              <span className="absolute top-3 left-3 text-[10.5px] font-bold bg-white/92 text-ink px-2.5 py-1 rounded-[7px]">{post.sport}</span>
              <div className="w-14 h-14 rounded-full bg-white/92 flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                <PlayIcon />
              </div>
              <span className="absolute bottom-3 right-3 bg-ink/78 text-white text-[11px] font-semibold px-2 py-1 rounded-[7px]">{post.duration}</span>
            </div>
            <p className="px-3.5 pt-[11px] pb-1.5 text-[13px] text-text leading-snug">
              <b className="text-ink">{post.caption}</b> {post.detail}
            </p>
            <div className="flex items-center gap-[18px] px-3.5 pb-3">
              <span className={`flex items-center gap-1.5 text-[12.5px] font-medium ${post.liked ? "text-brand" : "text-muted"}`}>
                ♥ {post.likes}
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-muted font-medium">💬 {post.comments}</span>
              {post.liked && <span className="text-[12.5px] text-muted font-medium">Share</span>}
            </div>
          </article>
        ))}
      </div>
    </PhoneShell>
  );
}
