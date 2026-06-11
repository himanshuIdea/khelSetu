import Link from "next/link";
import {
  BoltIcon,
  BoxIcon,
  CalendarIcon,
  CapIcon,
  CashIcon,
  CloseIcon,
  FlagIcon,
  GridIcon,
  TrophyIcon,
  UsersIcon,
} from "./icons";
import type { AcademyMeta } from "@/lib/repositories/types";

export type AcademyNavItem =
  | "dashboard"
  | "players"
  | "coaches"
  | "teams"
  | "tournaments"
  | "attendance"
  | "gear"
  | "fees";

type NavEntry = {
  id: AcademyNavItem;
  label: string;
  href: string;
  icon: React.ReactNode;
};

type AcademySidebarProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  activeItem: AcademyNavItem;
  onNavigate?: () => void;
  className?: string;
};

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3.5 mb-2 mx-2 text-[10.5px] font-semibold uppercase tracking-[1.4px] text-[#5d6b88]">
      {children}
    </div>
  );
}

function NavLink({
  entry,
  active,
  onNavigate,
}: {
  entry: NavEntry;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      className={`flex items-center gap-[11px] px-3 py-2.5 rounded-[11px] text-[13.5px] font-medium mb-[3px] transition-colors ${
        active
          ? "bg-ink3 text-white"
          : "text-[#aeb8d0] hover:text-white"
      }`}
    >
      <span className={active ? "text-brand" : ""}>{entry.icon}</span>
      {entry.label}
    </Link>
  );
}

export function AcademySidebar({
  academyId,
  academyMeta,
  activeItem,
  onNavigate,
  className = "",
}: AcademySidebarProps) {
  const base = `/academy/${academyId}`;
  const isDrawer = className.includes("fixed");

  const academyNav: NavEntry[] = [
    { id: "dashboard", label: "Dashboard", href: `${base}/dashboard`, icon: <GridIcon /> },
    { id: "players", label: "Players", href: `${base}/players`, icon: <UsersIcon /> },
    { id: "coaches", label: "Coaches", href: `${base}/coaches`, icon: <CapIcon /> },
    { id: "teams", label: "Teams", href: `${base}/teams`, icon: <FlagIcon /> },
    { id: "tournaments", label: "Tournaments", href: `${base}/tournaments`, icon: <TrophyIcon /> },
  ];

  const operationsNav: NavEntry[] = [
    { id: "attendance", label: "Attendance", href: `${base}/attendance`, icon: <CalendarIcon /> },
    { id: "gear", label: "Gear & Inventory", href: `${base}/gear`, icon: <BoxIcon /> },
    { id: "fees", label: "Fees & Payroll", href: `${base}/fees`, icon: <CashIcon /> },
  ];

  return (
    <aside
      className={`w-[236px] shrink-0 bg-ink text-white flex flex-col px-4 py-[22px] ${className}`}
    >
      <div className="flex items-center justify-between px-1.5 pb-[22px]">
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

      <nav className="flex-1 overflow-y-auto">
        <NavLabel>Academy</NavLabel>
        {academyNav.map((entry) => (
          <NavLink
            key={entry.id}
            entry={entry}
            active={activeItem === entry.id}
            onNavigate={onNavigate}
          />
        ))}

        <NavLabel>Operations</NavLabel>
        {operationsNav.map((entry) => (
          <NavLink
            key={entry.id}
            entry={entry}
            active={activeItem === entry.id}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-brand flex items-center justify-center font-bold text-[13px] text-white shrink-0">
          {academyMeta.adminInitials}
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-white">
            {academyMeta.adminName}
          </div>
          <div className="text-[11px] text-[#8c97b3]">{academyMeta.adminRole}</div>
        </div>
      </div>
    </aside>
  );
}
