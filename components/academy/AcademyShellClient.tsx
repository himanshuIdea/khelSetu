"use client";

import { useEffect, useState } from "react";
import type { AcademyMeta } from "@/lib/repositories/types";
import { AcademySidebar, type AcademyNavItem } from "./AcademySidebar";
import { AcademyTopBar } from "./AcademyTopBar";

type AcademyShellClientProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  activeItem: AcademyNavItem;
  searchPlaceholder?: string;
  children: React.ReactNode;
};

export function AcademyShellClient({
  academyId,
  academyMeta,
  activeItem,
  searchPlaceholder,
  children,
}: AcademyShellClientProps) {
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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen w-full">
        <AcademySidebar
          academyId={academyId}
          academyMeta={academyMeta}
          activeItem={activeItem}
          className="hidden lg:flex"
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

        <div className="flex flex-1 flex-col min-w-0 w-full">
          <AcademyTopBar
            academyMeta={academyMeta}
            searchPlaceholder={searchPlaceholder}
            onMenuToggle={() => setMenuOpen((open) => !open)}
            menuOpen={menuOpen}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
