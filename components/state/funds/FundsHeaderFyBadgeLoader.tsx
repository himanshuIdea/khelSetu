"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveStateNavItem } from "@/lib/state-nav";
import { FundsHeaderFyBadge } from "./FundsHeaderFyBadge";

/** Loads FY badge client-side on funds routes only — avoids blocking state layout SSR. */
export function FundsHeaderFyBadgeLoader() {
  const pathname = usePathname();
  const activeItem = getActiveStateNavItem(pathname);
  const [meta, setMeta] = useState<{
    fiscalYearLabel: string;
    fyTotalAllocatedPaise: number;
  } | null>(null);

  useEffect(() => {
    if (activeItem !== "funds") {
      setMeta(null);
      return;
    }

    let cancelled = false;

    void api.state.funds
      .fyMeta()
      .then(({ meta: nextMeta }) => {
        if (!cancelled) setMeta(nextMeta);
      })
      .catch(() => {
        if (!cancelled) {
          setMeta({ fiscalYearLabel: "2026-27", fyTotalAllocatedPaise: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeItem, pathname]);

  if (activeItem !== "funds" || !meta) return null;

  return <FundsHeaderFyBadge {...meta} />;
}
