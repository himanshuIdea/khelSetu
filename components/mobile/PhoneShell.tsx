"use client";

/**
 * Mockup preview frame — device bezel for gallery/demo only.
 * The live athlete app uses `PlayerLayoutClient` at `/player/*` (full viewport).
 */

import { usePathname } from "next/navigation";
import { getActivePlayerNavItem, playerRouteShowsTabBar } from "@/lib/player-nav";
import { PlayerTabBar } from "./PlayerTabBar";

type PhoneShellProps = {
  children: React.ReactNode;
  showTabBar?: boolean;
};

function StatusBar() {
  return (
    <div className="h-[46px] flex items-center justify-between px-[26px] pl-[30px] shrink-0">
      <span className="text-sm font-semibold text-ink tracking-[0.3px]">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="12" viewBox="0 0 18 12" aria-hidden="true">
          <rect x="0" y="7" width="3" height="5" rx="1" fill="#172139" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" fill="#172139" />
          <rect x="9" y="2.5" width="3" height="9.5" rx="1" fill="#172139" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#172139" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
          <path
            d="M8 11.5l7-7A9.7 9.7 0 008 1.8 9.7 9.7 0 001 4.5l7 7z"
            fill="none"
            stroke="#172139"
            strokeWidth="1.4"
          />
          <circle cx="8" cy="10" r="1.3" fill="#172139" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#172139" strokeOpacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill="#172139" />
          <rect x="23" y="4" width="1.5" height="4" rx="1" fill="#172139" fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

export function PhoneShell({ children, showTabBar = true }: PhoneShellProps) {
  const pathname = usePathname();
  const activeItem = getActivePlayerNavItem(pathname);
  const tabBarVisible = showTabBar && playerRouteShowsTabBar(pathname);

  return (
    <div className="min-h-screen bg-[#cfd6e4] flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[402px] p-[13px] bg-[#0B1424] rounded-[52px] shadow-[0_30px_70px_rgba(11,20,36,0.4)]">
        <div className="relative w-full max-w-[376px] mx-auto h-[812px] bg-[#F4F6FA] rounded-[40px] overflow-hidden flex flex-col">
          <div className="absolute top-[13px] left-1/2 -translate-x-1/2 w-[122px] h-[30px] bg-[#0B1424] rounded-b-[18px] z-10" />
          <StatusBar />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
          {tabBarVisible && <PlayerTabBar activeItem={activeItem} />}
        </div>
      </div>
    </div>
  );
}
