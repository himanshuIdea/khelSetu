"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getActiveStateNavItem,
  statePageMeta,
  stateSearchPlaceholders,
} from "@/lib/state-nav";
import { StateSearchProvider, useStateSearch } from "./StateSearchContext";
import { StateShellClient } from "./StateShellClient";
import { FundsHeaderFyBadge } from "./funds/FundsHeaderFyBadge";
import type { StateAdminMeta } from "./StateAdminMenu";

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
  adminMeta: StateAdminMeta;
  children: React.ReactNode;
};

function StateLayoutInner({ adminMeta, children }: StateLayoutClientProps) {
  const pathname = usePathname();
  const search = useStateSearch();
  const activeItem = getActiveStateNavItem(pathname);
  const searchPlaceholder = stateSearchPlaceholders[activeItem];
  const topBarSubtitle = topBarSubtitles[activeItem] ?? "State Sports Command Centre";
  const searchHidden = activeItem === "overview";

  useEffect(() => {
    search?.setQuery("");
  }, [pathname, search?.setQuery]);

  return (
    <StateShellClient
      activeItem={activeItem}
      adminMeta={adminMeta}
      searchPlaceholder={searchPlaceholder}
      searchHidden={searchHidden}
      topBarSubtitle={topBarSubtitle}
      topBarBadge={topBarBadges[activeItem]}
    >
      {children}
    </StateShellClient>
  );
}

export function StateLayoutClient({ adminMeta, children }: StateLayoutClientProps) {
  return (
    <StateSearchProvider>
      <StateLayoutInner adminMeta={adminMeta}>{children}</StateLayoutInner>
    </StateSearchProvider>
  );
}

export { statePageMeta };
