"use client";

import Link from "next/link";
import {
  GridIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/academy/icons";
import { mobileRoutes, type MobileNavItem } from "@/lib/mobile-nav";

type MobileTabBarProps = {
  activeItem: MobileNavItem;
};

const tabs: { id: MobileNavItem; label: string; icon: React.ReactNode; fab?: boolean }[] = [
  { id: "home", label: "Home", icon: <GridIcon className="w-[22px] h-[22px]" /> },
  { id: "explore", label: "Explore", icon: <SearchIcon className="w-[22px] h-[22px]" /> },
  { id: "submit", label: "", icon: <PlusIcon className="w-6 h-6 text-white" />, fab: true },
  { id: "drills", label: "Drills", icon: <VideoIcon className="w-[22px] h-[22px]" /> },
  { id: "profile", label: "Profile", icon: <UsersIcon className="w-[22px] h-[22px]" /> },
];

export function MobileTabBar({ activeItem }: MobileTabBarProps) {
  return (
    <nav className="h-[72px] bg-card border-t border-line flex items-start justify-around pt-[11px] shrink-0">
      {tabs.map((tab) => {
        const active = activeItem === tab.id;
        if (tab.fab) {
          return (
            <Link
              key={tab.id}
              href={mobileRoutes.submit}
              className="flex flex-col items-center gap-1 w-[58px] -mt-[22px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-[0_8px_18px_rgba(255,107,44,0.4)]">
                {tab.icon}
              </div>
            </Link>
          );
        }
        return (
          <Link
            key={tab.id}
            href={mobileRoutes[tab.id]}
            className={`flex flex-col items-center gap-1 w-[58px] text-[9.5px] font-medium ${
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
