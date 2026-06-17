"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AcademyTopBar } from "@/components/academy/AcademyTopBar";
import { CoachSidebar } from "@/components/coach/CoachSidebar";
import { CoachTabBar } from "@/components/coach/CoachTabBar";
import {
  coachMobileHeaderPaddingClass,
  coachRouteShowsTabBar,
  coachTabBarPaddingClass,
  getActiveCoachNavItem,
} from "@/lib/coach-nav";
import type { AcademyMeta, CoachPortalMeta } from "@/lib/repositories/types";

type CoachShellClientProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  coachMeta: CoachPortalMeta;
  children: React.ReactNode;
};

export function CoachShellClient({
  academyId,
  academyMeta,
  coachMeta,
  children,
}: CoachShellClientProps) {
  const pathname = usePathname();
  const activeItem = getActiveCoachNavItem(pathname);
  const showTabBar = coachRouteShowsTabBar(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Desktop / tablet landscape shell */}
      <div className="hidden lg:flex h-dvh overflow-hidden bg-surface w-full">
        <div className="flex h-full min-w-0 w-full">
          <CoachSidebar
            academyMeta={academyMeta}
            coachMeta={coachMeta}
            activeItem={activeItem}
            className="h-full"
          />
          <div className="flex flex-1 flex-col min-w-0 min-h-0 w-full overflow-hidden">
            <AcademyTopBar
              academyMeta={academyMeta}
              searchPlaceholder="Search your players and batches…"
            />
            {children}
          </div>
        </div>
      </div>

      {/* Mobile shell */}
      <div className="lg:hidden min-h-dvh w-full bg-[#F4F6FA] text-ink flex justify-center overflow-x-hidden">
        <div
          className="relative h-dvh w-full max-w-lg min-w-0 bg-[#F4F6FA] overflow-hidden"
          style={{ ["--coach-tab-bar-height" as string]: "72px" }}
        >
          <header className="fixed top-0 left-1/2 z-20 w-full max-w-lg min-w-0 -translate-x-1/2 shrink-0 bg-card border-b border-line px-4 py-3 pt-[max(12px,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[9px] bg-brand-soft border border-[#FFD9C5] flex items-center justify-center font-extrabold text-brand-d text-sm shrink-0">
                {academyMeta.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink truncate">{academyMeta.name}</div>
                <div className="text-[11px] text-muted truncate">{coachMeta.name} · Coach</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="w-9 h-9 rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted shrink-0 text-xs font-semibold"
                aria-label="Open menu"
              >
                ···
              </button>
            </div>
          </header>

          {menuOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-ink/50"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
          )}

          <CoachSidebar
            academyMeta={academyMeta}
            coachMeta={coachMeta}
            activeItem={activeItem}
            onNavigate={() => setMenuOpen(false)}
            className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          />

          <main
            className={`h-full overflow-y-auto overscroll-y-contain min-w-0 ${coachMobileHeaderPaddingClass} ${
              showTabBar ? coachTabBarPaddingClass : "pb-[env(safe-area-inset-bottom,0px)]"
            }`}
          >
            {children}
          </main>

          {showTabBar && (
            <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg min-w-0 -translate-x-1/2 bg-card pb-[env(safe-area-inset-bottom,0px)]">
              <CoachTabBar activeItem={activeItem} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
