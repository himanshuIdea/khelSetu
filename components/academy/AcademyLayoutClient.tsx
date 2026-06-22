"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AcademySearchProvider, useAcademySearch } from "./AcademySearchContext";
import { AcademyShellClient } from "./AcademyShellClient";
import { getActiveNavItem, searchPlaceholders } from "@/lib/academy-nav";
import type { AcademyNurseryFlag } from "@/lib/state-nurseries";
import type { AcademyMeta } from "@/lib/repositories/types";

type AcademyLayoutClientProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  nurseryFlag?: AcademyNurseryFlag | null;
  children: React.ReactNode;
};

function AcademyLayoutInner({
  academyId,
  academyMeta,
  nurseryFlag,
  children,
}: AcademyLayoutClientProps) {
  const pathname = usePathname();
  const search = useAcademySearch();
  const activeItem = getActiveNavItem(pathname);
  const searchPlaceholder = searchPlaceholders[activeItem];
  const searchHidden = activeItem === "dashboard";

  useEffect(() => {
    search?.setQuery("");
  }, [pathname, search?.setQuery]);

  return (
    <AcademyShellClient
      academyId={academyId}
      academyMeta={academyMeta}
      activeItem={activeItem}
      searchPlaceholder={searchPlaceholder}
      searchHidden={searchHidden}
      nurseryFlag={nurseryFlag}
    >
      {children}
    </AcademyShellClient>
  );
}

export function AcademyLayoutClient(props: AcademyLayoutClientProps) {
  return (
    <AcademySearchProvider>
      <AcademyLayoutInner {...props} />
    </AcademySearchProvider>
  );
}
