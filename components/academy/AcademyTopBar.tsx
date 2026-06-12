import { AdminAvatarMenu } from "./AdminAvatarMenu";
import { BellIcon, MenuIcon, SearchIcon } from "./icons";
import type { AcademyMeta } from "@/lib/repositories/types";

type AcademyTopBarProps = {
  academyMeta: AcademyMeta;
  searchPlaceholder?: string;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
};

export function AcademyTopBar({
  academyMeta,
  searchPlaceholder = "Search players, coaches, teams…",
  onMenuToggle,
  menuOpen,
}: AcademyTopBarProps) {
  return (
    <header className="shrink-0 bg-card border-b border-line">
      <div className="flex items-center gap-3 md:gap-[18px] px-4 md:px-[26px] min-h-[66px] py-3 justify-between">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden w-[38px] h-[38px] rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted shrink-0"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>
        )}

        <div className="flex items-center gap-[11px] min-w-0">
          <div className="w-9 h-9 rounded-[9px] bg-brand-soft border border-[#FFD9C5] flex items-center justify-center font-extrabold text-brand-d text-sm shrink-0">
            {academyMeta.initials}
          </div>
          <div className="min-w-0 hidden md:block">
            <div className="text-sm font-bold text-ink truncate">{academyMeta.name}</div>
            <div className="text-[11.5px] text-muted truncate">{academyMeta.location}</div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 max-w-[420px] items-center gap-[9px] bg-surface border border-line rounded-[11px] px-[13px] py-[9px] text-muted2">
          <SearchIcon />
          <span className="text-[13px] truncate">{searchPlaceholder}</span>
        </div>

        <div className="flex-1 lg:flex-none" />

        
        <div className="flex gap-3 lg:flex-none" >
        <button
          type="button"
          className="relative w-[38px] h-[38px] rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted shrink-0"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="absolute top-2 right-[9px] w-[7px] h-[7px] rounded-full bg-brand border-2 border-card" />
        </button>

        <AdminAvatarMenu initials={academyMeta.adminInitials} />
        </div>

      </div>

      <div className="lg:hidden px-4 pb-3 md:px-[26px]">
        <div className="flex items-center gap-[9px] bg-surface border border-line rounded-[11px] px-[13px] py-[9px] text-muted2">
          <SearchIcon />
          <span className="text-[13px] truncate">{searchPlaceholder}</span>
        </div>
      </div>
    </header>
  );
}
