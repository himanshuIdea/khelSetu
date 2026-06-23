"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { portalLoginRoutes, type PortalKind } from "@/lib/auth/portal-login";
import { usePortalLogout } from "@/lib/hooks/use-portal-logout";

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 148;
const MENU_GAP = 6;

type PortalAvatarMenuProps = {
  initials: string;
  avatarColor?: string;
  portal: Extract<PortalKind, "admin" | "coach">;
  align?: "end" | "start";
  preferOpenUpward?: boolean;
  onLoggedOut?: () => void;
  buttonClassName?: string;
  ariaLabel?: string;
  renderTrigger?: (props: {
    open: boolean;
    toggle: () => void;
    buttonRef: Ref<HTMLButtonElement>;
  }) => ReactNode;
};

export function PortalAvatarMenu({
  initials,
  avatarColor,
  portal,
  align = "end",
  preferOpenUpward = false,
  onLoggedOut,
  buttonClassName = "",
  ariaLabel = "Account menu",
  renderTrigger,
}: PortalAvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, loggingOut } = usePortalLogout(portalLoginRoutes[portal]);

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
    const openUpward = preferOpenUpward || spaceBelow < menuHeight + MENU_GAP;

    const left =
      align === "start"
        ? Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8))
        : Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));

    setPosition({
      top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left,
    });
  }, [align, preferOpenUpward]);

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

  function toggle() {
    setOpen((current) => !current);
  }

  async function handleLogout() {
    setOpen(false);
    onLoggedOut?.();
    await logout();
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
        className="w-full min-h-[44px] text-left px-3.5 py-2.5 text-[13px] text-red hover:bg-red-soft transition-colors disabled:opacity-60"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  ) : null;

  const defaultChipClassName =
    portal === "coach" && avatarColor
      ? "w-[38px] h-[38px] rounded-[10px] flex items-center justify-center font-bold text-[13px] text-white shrink-0"
      : "w-[38px] h-[38px] rounded-[10px] bg-linear-to-br from-ink2 to-ink3 flex items-center justify-center font-bold text-[13px] text-white shrink-0";

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open, toggle, buttonRef })
      ) : (
        <button
          ref={buttonRef}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
          className={`${defaultChipClassName} ${buttonClassName}`.trim()}
          style={portal === "coach" && avatarColor ? { background: avatarColor } : undefined}
        >
          {initials}
        </button>
      )}

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
