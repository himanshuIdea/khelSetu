"use client";

import Link from "next/link";
import {
  CalendarIcon,
  FlagIcon,
  GridIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { coachRoutes, type CoachNavItem } from "@/lib/coach-nav";

type CoachTabBarProps = {
  activeItem: CoachNavItem;
};

const tabs: { id: CoachNavItem; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <GridIcon className="w-[22px] h-[22px]" /> },
  { id: "players", label: "Players", icon: <UsersIcon className="w-[22px] h-[22px]" /> },
  { id: "attendance", label: "Attendance", icon: <CalendarIcon className="w-[22px] h-[22px]" /> },
  { id: "teams", label: "Teams", icon: <FlagIcon className="w-[22px] h-[22px]" /> },
];

export function CoachTabBar({ activeItem }: CoachTabBarProps) {
  return (
    <nav className="h-[72px] bg-card border-t border-line flex items-start justify-around pt-[11px] shrink-0">
      {tabs.map((tab) => {
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
