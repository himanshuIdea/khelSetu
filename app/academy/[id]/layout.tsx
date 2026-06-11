import { AcademyLayoutClient } from "@/components/academy/AcademyLayoutClient";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

type AcademyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function AcademyLayout({
  children,
  params,
}: AcademyLayoutProps) {
  const { id } = await params;
  const academyMeta = await resolveAcademy(id);

  return (
    <AcademyLayoutClient academyId={id} academyMeta={academyMeta}>
      {children}
    </AcademyLayoutClient>
  );
}
