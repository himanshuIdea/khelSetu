"use client";

import { usePathname } from "next/navigation";
import { PlayerTabBar } from "@/components/mobile/PlayerTabBar";
import { getActivePlayerNavItem } from "@/lib/player-nav";

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
      <div className="relative flex flex-col h-dvh w-full max-w-lg min-w-0 bg-[#F4F6FA] overflow-hidden">
        <main className="h-full flex flex-col min-h-0 min-w-0 w-full overflow-x-clip overflow-hidden pt-[env(safe-area-inset-top,0px)]">
          {children}
        </main>

        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg min-w-0 -translate-x-1/2 bg-card border-t border-line pb-[env(safe-area-inset-bottom,0px)]">
          <PlayerTabBar activeItem={activeItem} />
        </div>
      </div>
    </div>
  );
}
