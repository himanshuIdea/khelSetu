import type { AcademyMeta } from "@/lib/repositories/types";
import { AcademySidebar, type AcademyNavItem } from "./AcademySidebar";
import { AcademyTopBar } from "./AcademyTopBar";

type AcademyShellProps = {
  academyId: string;
  academyMeta: AcademyMeta;
  activeItem: AcademyNavItem;
  searchPlaceholder?: string;
  children: React.ReactNode;
};

export function AcademyShell({
  academyId,
  academyMeta,
  activeItem,
  searchPlaceholder,
  children,
}: AcademyShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      <AcademySidebar
        academyId={academyId}
        academyMeta={academyMeta}
        activeItem={activeItem}
        className="h-full"
      />
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <AcademyTopBar academyMeta={academyMeta} searchPlaceholder={searchPlaceholder} />
        {children}
      </div>
    </div>
  );
}
