import Link from "next/link";
import {
  BoltIcon,
  CapIcon,
  CashIcon,
  ChartIcon,
  CloseIcon,
  GridIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { StateAdminMenu, type StateAdminMeta } from "./StateAdminMenu";

export type StateNavItem =
  | "overview"
  | "nurseries"
  | "athletes"
  | "scouting"
  | "verification"
  | "funds"
  | "districts"
  | "reports";

type NavEntry = {
  id: StateNavItem;
  label: string;
  href: string;
  icon: React.ReactNode;
};

type StateSidebarProps = {
  activeItem: StateNavItem;
  adminMeta: StateAdminMeta;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
};

function NavLabel({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) return null;

  return (
    <div className="mt-3.5 mb-2 mx-2 text-[10.5px] font-semibold uppercase tracking-[1.4px] text-[#5d6b88]">
      {children}
    </div>
  );
}

function NavLink({
  entry,
  active,
  collapsed,
  onNavigate,
}: {
  entry: NavEntry;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      title={collapsed ? entry.label : undefined}
      aria-label={collapsed ? entry.label : undefined}
      className={`flex items-center rounded-[11px] text-[13.5px] font-medium mb-[3px] transition-colors min-h-[44px] ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-[11px] px-3 py-2.5"
      } ${active ? "bg-ink3 text-white" : "text-[#aeb8d0] hover:text-white hover:bg-white/5"}`}
    >
      <span className={`shrink-0 ${active ? "text-brand" : ""}`}>{entry.icon}</span>
      {!collapsed && <span className="truncate">{entry.label}</span>}
    </Link>
  );
}

export function StateSidebar({
  activeItem,
  adminMeta,
  onNavigate,
  className = "",
  collapsed = false,
}: StateSidebarProps) {
  const base = "/state";
  const isDrawer = className.includes("fixed");

  const overviewNav: NavEntry[] = [
    { id: "overview", label: "State overview", href: `${base}/overview`, icon: <GridIcon /> },
    { id: "nurseries", label: "Sports nurseries", href: `${base}/nurseries`, icon: <CapIcon /> },
    { id: "athletes", label: "Athletes", href: `${base}/athletes`, icon: <UsersIcon /> },
    {
      id: "scouting",
      label: "Talent scouting",
      href: `${base}/scouting`,
      icon: <SearchIcon className="w-[18px] h-[18px]" />,
    },
  ];

  const governanceNav: NavEntry[] = [
    {
      id: "verification",
      label: "Verification",
      href: `${base}/verification`,
      icon: <ShieldIcon className="w-[18px] h-[18px]" />,
    },
    { id: "funds", label: "Fund utilisation", href: `${base}/funds`, icon: <CashIcon /> },
    {
      id: "districts",
      label: "Districts",
      href: `${base}/districts`,
      icon: <PinIcon className="w-[18px] h-[18px]" />,
    },
    {
      id: "reports",
      label: "Reports",
      href: `${base}/reports`,
      icon: <ChartIcon className="w-[18px] h-[18px]" />,
    },
  ];

  const widthClass = collapsed && !isDrawer ? "w-[72px]" : "w-[236px]";
  const paddingClass = collapsed && !isDrawer ? "px-2.5" : "px-4";

  return (
    <aside
      className={`${widthClass} shrink-0 bg-ink text-white flex flex-col ${paddingClass} py-[22px] min-h-0 overflow-x-hidden transition-[width] duration-200 ease-in-out ${className}`}
    >
      <div
        className={`flex items-center pb-[22px] shrink-0 ${
          collapsed && !isDrawer ? "justify-center px-0" : "justify-between px-1.5"
        }`}
      >
        <div
          className={`flex items-center min-w-0 ${
            collapsed && !isDrawer ? "justify-center" : "gap-2.5"
          }`}
        >
          <div className="w-[34px] h-[34px] rounded-[10px] bg-linear-to-br from-brand to-[#FF9152] flex items-center justify-center shrink-0">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isDrawer) && (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="font-bold text-lg tracking-[-0.2px] truncate">
                Khel<span className="text-brand">Setu</span>
              </div>
              <span className="text-[8.5px] font-bold tracking-[1px] bg-ink3 text-[#9DB0D8] px-1.5 py-0.5 rounded-[5px] shrink-0">
                STATE
              </span>
            </div>
          )}
        </div>
        {isDrawer && onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#aeb8d0] hover:text-white lg:hidden min-h-[44px] min-w-[44px]"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]">
        <NavLabel collapsed={collapsed && !isDrawer}>Overview</NavLabel>
        {overviewNav.map((entry) => (
          <NavLink
            key={entry.id}
            entry={entry}
            active={activeItem === entry.id}
            collapsed={collapsed && !isDrawer}
            onNavigate={onNavigate}
          />
        ))}

        <NavLabel collapsed={collapsed && !isDrawer}>Governance</NavLabel>
        {governanceNav.map((entry) => (
          <NavLink
            key={entry.id}
            entry={entry}
            active={activeItem === entry.id}
            collapsed={collapsed && !isDrawer}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <StateAdminMenu
        adminMeta={adminMeta}
        onLoggedOut={onNavigate}
        collapsed={collapsed && !isDrawer}
      />
    </aside>
  );
}
