"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type AdminAvatarMenuProps = {
  initials: string;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 148;
const MENU_GAP = 6;

export function AdminAvatarMenu({ initials }: AdminAvatarMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
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
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + MENU_GAP;

    setPosition({
      top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
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
    setLoggingOut(true);
    try {
      await api.auth.logout();
    } catch {
      // Continue to login even if logout fails.
    }
    router.replace("/auth/login");
  }

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
      className="fixed z-50 min-w-[148px] bg-white border border-line rounded-[11px] shadow-card py-1"
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
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-[38px] h-[38px] rounded-[10px] bg-linear-to-br from-ink2 to-ink3 flex items-center justify-center font-bold text-[13px] text-white shrink-0"
      >
        {initials}
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
