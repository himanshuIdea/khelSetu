"use client";

import { portalLoginRoutes, type PortalKind } from "@/lib/auth/portal-login";
import { usePortalLogout } from "@/lib/hooks/use-portal-logout";

type PortalLogoutButtonProps = {
  portal: Extract<PortalKind, "player" | "coach">;
  variant?: "sidebar" | "profile";
  className?: string;
  onLoggedOut?: () => void;
};

const variantClassName: Record<NonNullable<PortalLogoutButtonProps["variant"]>, string> = {
  sidebar:
    "mt-2 w-full text-left px-3 py-2.5 rounded-[11px] text-[13px] font-medium text-[#ff9b9b] hover:bg-white/5 transition-colors disabled:opacity-60",
  profile:
    "w-full bg-card border border-line rounded-[13px] py-3.5 text-[13.5px] font-semibold text-red hover:bg-red-soft transition-colors disabled:opacity-60",
};

export function PortalLogoutButton({
  portal,
  variant = "profile",
  className = "",
  onLoggedOut,
}: PortalLogoutButtonProps) {
  const { logout, loggingOut } = usePortalLogout(portalLoginRoutes[portal]);

  async function handleLogout() {
    onLoggedOut?.();
    await logout();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={`${variantClassName[variant]} ${className}`.trim()}
    >
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}
