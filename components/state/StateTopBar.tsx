import { BellIcon, MenuIcon, SearchIcon, ShieldIcon } from "@/components/academy/icons";
import { Pill } from "@/components/academy/shared";

type StateTopBarProps = {
  searchPlaceholder?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
};

export function StateTopBar({
  searchPlaceholder = "Search nurseries, athletes, districts…",
  subtitle = "State Sports Command Centre",
  badge,
  onMenuToggle,
  menuOpen,
}: StateTopBarProps) {
  return (
    <header className="shrink-0 bg-card border-b border-line">
      <div className="flex items-center gap-3 md:gap-[18px] px-4 md:px-[26px] min-h-[66px] py-3">
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
          <div className="w-9 h-9 rounded-[9px] bg-green-soft border border-[#B6ECDC] flex items-center justify-center text-[#0E9B72] shrink-0">
            <ShieldIcon className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 hidden md:block">
            <div className="text-sm font-bold text-ink truncate">
              Sports Department, Government of Haryana
            </div>
            <div className="text-[11.5px] text-muted truncate">{subtitle}</div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 max-w-[420px] items-center gap-[9px] bg-surface border border-line rounded-[11px] px-[13px] py-[9px] text-muted2">
          <SearchIcon />
          <span className="text-[13px] truncate">{searchPlaceholder}</span>
        </div>

        <div className="flex-1 lg:flex-none" />

        {badge ?? (
          <Pill variant="green" className="hidden sm:inline-flex px-3 py-[7px]">
            <span className="w-[7px] h-[7px] rounded-full bg-green" />
            Live · all 22 districts
          </Pill>
        )}

        <button
          type="button"
          className="lg:hidden w-[38px] h-[38px] rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted shrink-0"
          aria-label="Search"
        >
          <SearchIcon />
        </button>

        <button
          type="button"
          className="relative w-[38px] h-[38px] rounded-[10px] bg-surface border border-line flex items-center justify-center text-muted shrink-0"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="absolute top-2 right-[9px] w-[7px] h-[7px] rounded-full bg-brand border-2 border-card" />
        </button>

        <div className="w-[38px] h-[38px] rounded-[10px] bg-linear-to-br from-[#0E9B72] to-green flex items-center justify-center shrink-0">
          <ShieldIcon className="w-[18px] h-[18px] text-white" />
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
