"use client";

import Link from "next/link";
import {
  CalendarIcon,
  FlagIcon,
  GridIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { coachRoutes, type CoachNavItem } from "@/lib/coach-nav";

type CoachTabBarProps = {
  activeItem: CoachNavItem;
};

type TabEntry =
  | { kind: "link"; id: CoachNavItem; label: string; icon: React.ReactNode }
  | { kind: "fab"; label: string; icon: React.ReactNode };

const tabs: TabEntry[] = [
  { kind: "link", id: "home", label: "Home", icon: <GridIcon className="w-[22px] h-[22px]" /> },
  { kind: "link", id: "players", label: "Players", icon: <UsersIcon className="w-[22px] h-[22px]" /> },
  { kind: "fab", label: "", icon: <PlusIcon className="w-6 h-6 text-white" /> },
  {
    kind: "link",
    id: "attendance",
    label: "Attendance",
    icon: <CalendarIcon className="w-[22px] h-[22px]" />,
  },
  { kind: "link", id: "teams", label: "Teams", icon: <FlagIcon className="w-[22px] h-[22px]" /> },
];

export function CoachTabBar({ activeItem }: CoachTabBarProps) {
  return (
    <nav
      aria-label="Coach navigation"
      className="h-[72px] bg-card border-t border-line flex items-start justify-around pt-[11px] shrink-0"
    >
      {tabs.map((tab) => {
        if (tab.kind === "fab") {
          return (
            <Link
              key="post"
              href={coachRoutes.post}
              className="flex flex-col items-center gap-1 w-[58px] -mt-[22px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-[0_8px_18px_rgba(255,107,44,0.4)]">
                {tab.icon}
              </div>
            </Link>
          );
        }

        const active = activeItem === tab.id;
        return (
          <Link
            key={tab.id}
            href={coachRoutes[tab.id]}
            className={`flex flex-col items-center gap-1 w-[58px] min-h-[44px] text-[9.5px] font-medium ${
              active ? "text-ink" : "text-muted2"
            }`}
          >
            <span className={active ? "text-brand" : ""}>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
