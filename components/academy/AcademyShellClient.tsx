"use client";

import { useEffect, useState } from "react";
import type { AcademyMeta } from "@/lib/repositories/types";
import type { AcademyNurseryFlag } from "@/lib/state-nurseries";
import { api } from "@/lib/api";
import { AcademySidebar, type AcademyNavItem } from "./AcademySidebar";
import { AcademyTopBar } from "./AcademyTopBar";
import { NurseryFlagBanner } from "./NurseryFlagBanner";
import { NurseryDeregisteredBanner } from "./NurseryDeregisteredBanner";

type AcademyShellClientProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  activeItem: AcademyNavItem;
  searchPlaceholder?: string;
  searchHidden?: boolean;
  nurseryFlag?: AcademyNurseryFlag | null;
  nurseryDeregistered?: boolean;
  children: React.ReactNode;
};

export function AcademyShellClient({
  academyId,
  academyMeta,
  activeItem,
  searchPlaceholder,
  searchHidden = false,
  nurseryFlag = null,
  nurseryDeregistered = false,
  children,
}: AcademyShellClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveFlag, setLiveFlag] = useState<AcademyNurseryFlag | null>(nurseryFlag);

  useEffect(() => {
    setLiveFlag(nurseryFlag);
  }, [nurseryFlag]);

  useEffect(() => {
    async function refreshFlag() {
      try {
        const { flag } = await api.academy.nurseryFlag.get(academyId);
        setLiveFlag(flag);
      } catch {
        // Keep current banner state on auth or network errors.
      }
    }

    function onFocus() {
      void refreshFlag();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshFlag();
      }
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [academyId]);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="h-dvh overflow-hidden bg-surface">
      <div className="flex h-full min-h-0 w-full">
        <AcademySidebar
          academyId={academyId}
          academyMeta={academyMeta}
          activeItem={activeItem}
          className="hidden lg:flex h-full"
        />

        {menuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
        )}

        <AcademySidebar
          academyId={academyId}
          academyMeta={academyMeta}
          activeItem={activeItem}
          onNavigate={closeMenu}
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 lg:hidden ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        />

        <div className="flex flex-1 flex-col min-w-0 min-h-0 w-full overflow-hidden">
          <AcademyTopBar
            academyMeta={academyMeta}
            searchPlaceholder={searchPlaceholder}
            searchHidden={searchHidden}
            onMenuToggle={() => setMenuOpen((open) => !open)}
            menuOpen={menuOpen}
          />
          {nurseryDeregistered ? <NurseryDeregisteredBanner /> : null}
          {liveFlag ? (
            <NurseryFlagBanner academyId={academyId} flag={liveFlag} />
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
