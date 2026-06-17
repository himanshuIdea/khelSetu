"use client";

import { usePathname } from "next/navigation";
import { getActivePlayerNavItem, playerTabBarPaddingClass } from "@/lib/player-nav";
import { PlayerTabBar } from "@/components/mobile/PlayerTabBar";

type PlayerLayoutClientProps = {
  children: React.ReactNode;
};

/**
 * Full-viewport mobile web app shell for `/player/*`.
 * No device bezel — fills the browser on phone and centers a mobile column on desktop.
 */
export function PlayerLayoutClient({ children }: PlayerLayoutClientProps) {
  const pathname = usePathname();
  const activeItem = getActivePlayerNavItem(pathname);

  return (
    <div
      className="min-h-dvh w-full bg-[#F4F6FA] text-ink flex justify-center overflow-x-hidden"
      style={{ ["--player-tab-bar-height" as string]: "72px" }}
    >
      <div className="relative flex flex-col min-h-dvh w-full max-w-lg min-w-0 bg-[#F4F6FA]">
        <main
          className={`flex flex-1 flex-col min-h-0 min-w-0 overflow-y-auto overscroll-y-contain pt-[env(safe-area-inset-top,0px)] ${playerTabBarPaddingClass}`}
        >
          {children}
        </main>

        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg min-w-0 -translate-x-1/2 bg-card pb-[env(safe-area-inset-bottom,0px)]">
          <PlayerTabBar activeItem={activeItem} />
        </div>
      </div>
    </div>
  );
}
