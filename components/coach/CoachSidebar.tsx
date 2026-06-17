import Link from "next/link";
import {
  BoltIcon,
  CalendarIcon,
  CapIcon,
  CloseIcon,
  FlagIcon,
  GridIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/academy/icons";
import type { AcademyMeta, CoachPortalMeta } from "@/lib/repositories/types";
import { coachRoutes, type CoachNavItem } from "@/lib/coach-nav";

type NavEntry = {
  id: CoachNavItem;
  label: string;
  href: string;
  icon: React.ReactNode;
};

type CoachSidebarProps = {
  academyMeta: AcademyMeta;
  coachMeta: CoachPortalMeta;
  activeItem: CoachNavItem;
  onNavigate?: () => void;
  className?: string;
};

const navEntries: NavEntry[] = [
  { id: "home", label: "Home", href: coachRoutes.home, icon: <GridIcon /> },
  { id: "players", label: "Players", href: coachRoutes.players, icon: <UsersIcon /> },
  { id: "attendance", label: "Attendance", href: coachRoutes.attendance, icon: <CalendarIcon /> },
  { id: "media", label: "Media", href: coachRoutes.media, icon: <VideoIcon /> },
  { id: "teams", label: "Teams", href: coachRoutes.teams, icon: <FlagIcon /> },
];

export function CoachSidebar({
  academyMeta,
  coachMeta,
  activeItem,
  onNavigate,
  className = "",
}: CoachSidebarProps) {
  const isDrawer = className.includes("fixed");

  return (
    <aside
      className={`w-[236px] shrink-0 bg-ink text-white flex flex-col h-full min-h-0 pl-4 pr-2 py-[22px] ${className}`}
    >
      <div className="shrink-0 flex items-center justify-between px-1.5 pb-[22px]">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-linear-to-br from-brand to-[#FF9152] flex items-center justify-center">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          <div className="font-bold text-lg tracking-[-0.2px]">
            Khel<span className="text-brand">Setu</span>
          </div>
        </div>
        {isDrawer && onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#aeb8d0] hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="shrink-0 px-2 pb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-[#5d6b88] mb-2">
          Coach portal
        </div>
        <div className="text-[12px] text-[#aeb8d0] truncate">{academyMeta.name}</div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto">
        {navEntries.map((entry) => (
          <Link
            key={entry.id}
            href={entry.href}
            onClick={onNavigate}
            className={`flex w-full items-center gap-[11px] px-3 py-2.5 rounded-[11px] text-[13.5px] font-medium mb-[3px] transition-colors ${
              activeItem === entry.id
                ? "bg-ink3 text-white"
                : "text-[#aeb8d0] hover:text-white"
            }`}
          >
            <span className={activeItem === entry.id ? "text-brand" : ""}>{entry.icon}</span>
            {entry.label}
          </Link>
        ))}
      </nav>

      <div className="shrink-0 mt-auto flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5">
        <div
          className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-[13px] text-white shrink-0"
          style={{ background: coachMeta.avatarColor }}
        >
          {coachMeta.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-white truncate">{coachMeta.name}</div>
          <div className="text-[11px] text-[#8c97b3] flex items-center gap-1 truncate">
            <CapIcon className="w-3 h-3 shrink-0" />
            {coachMeta.role}
          </div>
        </div>
      </div>
    </aside>
  );
}
