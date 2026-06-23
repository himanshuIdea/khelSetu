"use client";

import { useEffect, useMemo } from "react";
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

export type StateFundsFyMeta = {
  fiscalYearLabel: string;
  fyTotalAllocatedPaise: number;
};

type StateLayoutClientProps = {
  adminMeta: StateAdminMeta;
  fundsFyMeta: StateFundsFyMeta;
  children: React.ReactNode;
};

function StateLayoutInner({ adminMeta, fundsFyMeta, children }: StateLayoutClientProps) {
  const pathname = usePathname();
  const search = useStateSearch();
  const activeItem = getActiveStateNavItem(pathname);
  const searchPlaceholder = stateSearchPlaceholders[activeItem];
  const topBarSubtitle = topBarSubtitles[activeItem] ?? "State Sports Command Centre";
  const searchHidden = activeItem === "overview";

  const topBarBadge = useMemo(() => {
    if (activeItem === "scouting") {
      return (
        <span className="hidden sm:inline-flex items-center gap-[5px] text-[11px] font-semibold px-3 py-[7px] rounded-full bg-green-soft text-[#0E9B72]">
          <span className="w-[7px] h-[7px] rounded-full bg-green" />
          Live
        </span>
      );
    }
    if (activeItem === "funds") {
      return <FundsHeaderFyBadge {...fundsFyMeta} />;
    }
    return undefined;
  }, [activeItem, fundsFyMeta]);

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
      topBarBadge={topBarBadge}
    >
      {children}
    </StateShellClient>
  );
}

export function StateLayoutClient({ adminMeta, fundsFyMeta, children }: StateLayoutClientProps) {
  return (
    <StateSearchProvider>
      <StateLayoutInner adminMeta={adminMeta} fundsFyMeta={fundsFyMeta}>
        {children}
      </StateLayoutInner>
    </StateSearchProvider>
  );
}

export { statePageMeta };
