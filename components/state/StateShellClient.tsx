"use client";

import { useEffect, useState } from "react";
import { StateSidebar, type StateNavItem } from "./StateSidebar";
import { StateTopBar } from "./StateTopBar";

type StateShellClientProps = {
  activeItem: StateNavItem;
  searchPlaceholder?: string;
  topBarSubtitle?: string;
  topBarBadge?: React.ReactNode;
  children: React.ReactNode;
};

export function StateShellClient({
  activeItem,
  searchPlaceholder,
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
    <div className="flex min-h-screen bg-surface">
      <StateSidebar activeItem={activeItem} className="hidden lg:flex" />

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
        onNavigate={closeMenu}
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 lg:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      <div className="flex flex-1 flex-col min-w-0 w-full">
        <StateTopBar
          searchPlaceholder={searchPlaceholder}
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
