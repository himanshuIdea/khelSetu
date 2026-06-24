"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldIcon } from "@/components/academy/icons";
import { portalLoginRoutes } from "@/lib/auth/portal-login";
import { usePortalLogout } from "@/lib/hooks/use-portal-logout";

export type StateAdminMeta = {
  fullName: string;
};

type StateAdminMenuProps = {
  adminMeta: StateAdminMeta;
  onLoggedOut?: () => void;
  collapsed?: boolean;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

const MENU_GAP = 6;

export function StateAdminMenu({ adminMeta, onLoggedOut, collapsed = false }: StateAdminMenuProps) {
  const { logout, loggingOut } = usePortalLogout(portalLoginRoutes.state);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, width: 148 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? 48;
    const menuWidth = Math.max(rect.width, 148);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + MENU_GAP;

    setPosition({
      top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      width: menuWidth,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  async function handleLogout() {
    setOpen(false);
    onLoggedOut?.();
    await logout();
  }

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: position.top, left: position.left, width: position.width }}
      className="fixed z-50 bg-white border border-line rounded-[11px] shadow-card py-1"
    >
      <button
        type="button"
        role="menuitem"
        disabled={loggingOut}
        onClick={handleLogout}
        className="w-full text-left px-3.5 py-2.5 text-[13px] text-red hover:bg-red-soft transition-colors disabled:opacity-60"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account menu — ${adminMeta.fullName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        title={collapsed ? adminMeta.fullName : undefined}
        className={`mt-auto flex w-full items-center rounded-xl bg-white/5 text-left transition-colors hover:bg-white/10 ${
          collapsed ? "justify-center p-2.5 min-h-[44px]" : "gap-2.5 p-2.5"
        }`}
      >
        <div className="w-[34px] h-[34px] rounded-[9px] bg-green flex items-center justify-center shrink-0">
          <ShieldIcon className="w-[18px] h-[18px] text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-white truncate">{adminMeta.fullName}</div>
            <div className="text-[11px] text-[#8c97b3]">State Administrator</div>
          </div>
        )}
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
