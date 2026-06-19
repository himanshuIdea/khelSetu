"use client";

import { usePathname } from "next/navigation";
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

export function AcademyLayoutClient({
  academyId,
  academyMeta,
  nurseryFlag = null,
  children,
}: AcademyLayoutClientProps) {
  const pathname = usePathname();
  const activeItem = getActiveNavItem(pathname);
  const searchPlaceholder = searchPlaceholders[activeItem];

  return (
    <AcademyShellClient
      academyId={academyId}
      academyMeta={academyMeta}
      activeItem={activeItem}
      searchPlaceholder={searchPlaceholder}
      nurseryFlag={nurseryFlag}
    >
      {children}
    </AcademyShellClient>
  );
}
