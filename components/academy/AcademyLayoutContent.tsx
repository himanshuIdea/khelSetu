import { AcademyLayoutClient } from "@/components/academy/AcademyLayoutClient";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

type AcademyLayoutContentProps = {
  academyId: string;
  children: React.ReactNode;
};

export async function AcademyLayoutContent({ academyId, children }: AcademyLayoutContentProps) {
  const academyMeta = await resolveAcademy(academyId);

  return (
    <AcademyLayoutClient academyId={academyId} academyMeta={academyMeta}>
      {children}
    </AcademyLayoutClient>
  );
}
