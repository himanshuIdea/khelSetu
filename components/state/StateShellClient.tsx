"use client";

import { useEffect, useState } from "react";
import { StateSidebar, type StateNavItem } from "./StateSidebar";
import { StateTopBar } from "./StateTopBar";
import type { StateAdminMeta } from "./StateAdminMenu";

type StateShellClientProps = {
  activeItem: StateNavItem;
  adminMeta: StateAdminMeta;
  searchPlaceholder?: string;
  searchHidden?: boolean;
  topBarSubtitle?: string;
  topBarBadge?: React.ReactNode;
  children: React.ReactNode;
};

export function StateShellClient({
  activeItem,
  adminMeta,
  searchPlaceholder,
  searchHidden = false,
  topBarSubtitle,
  topBarBadge,
  children,
}: StateShellClientProps) {
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
    <div className="flex h-dvh overflow-hidden bg-surface">
      <StateSidebar activeItem={activeItem} adminMeta={adminMeta} className="hidden lg:flex" />

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      <StateSidebar
        activeItem={activeItem}
        adminMeta={adminMeta}
        onNavigate={closeMenu}
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 lg:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full overflow-hidden">
        <StateTopBar
          searchPlaceholder={searchPlaceholder}
          searchHidden={searchHidden}
          subtitle={topBarSubtitle}
          badge={topBarBadge}
          onMenuToggle={() => setMenuOpen((open) => !open)}
          menuOpen={menuOpen}
        />
        {children}
      </div>
    </div>
  );
}
