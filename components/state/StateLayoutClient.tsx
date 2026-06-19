"use client";

import { usePathname } from "next/navigation";
import {
  getActiveStateNavItem,
  statePageMeta,
  stateSearchPlaceholders,
} from "@/lib/state-nav";
import { StateSearchProvider } from "./StateSearchContext";
import { StateShellClient } from "./StateShellClient";
import { FundsHeaderFyBadge } from "./funds/FundsHeaderFyBadge";

const topBarSubtitles: Partial<Record<ReturnType<typeof getActiveStateNavItem>, string>> = {
  scouting: "Talent scouting & athlete pipeline",
  funds: "Schemes & fund disbursement (DBT)",
};

const topBarBadges: Partial<Record<ReturnType<typeof getActiveStateNavItem>, React.ReactNode>> = {
  scouting: (
    <span className="hidden sm:inline-flex items-center gap-[5px] text-[11px] font-semibold px-3 py-[7px] rounded-full bg-green-soft text-[#0E9B72]">
      <span className="w-[7px] h-[7px] rounded-full bg-green" />
      Live
    </span>
  ),
  funds: <FundsHeaderFyBadge />,
};

type StateLayoutClientProps = {
  children: React.ReactNode;
};

export function StateLayoutClient({ children }: StateLayoutClientProps) {
  const pathname = usePathname();
  const activeItem = getActiveStateNavItem(pathname);
  const searchPlaceholder = stateSearchPlaceholders[activeItem];
  const topBarSubtitle = topBarSubtitles[activeItem] ?? "State Sports Command Centre";

  return (
    <StateSearchProvider>
      <StateShellClient
        activeItem={activeItem}
        searchPlaceholder={searchPlaceholder}
        topBarSubtitle={topBarSubtitle}
        topBarBadge={topBarBadges[activeItem]}
      >
        {children}
      </StateShellClient>
    </StateSearchProvider>
  );
}

export { statePageMeta };
