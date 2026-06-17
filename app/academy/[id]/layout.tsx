import { Suspense } from "react";
import { AcademyLayoutContent } from "@/components/academy/AcademyLayoutContent";
import { AcademyShellSkeleton } from "@/components/academy/AcademyShellSkeleton";

type AcademyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function AcademyLayout({ children, params }: AcademyLayoutProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<AcademyShellSkeleton />}>
      <AcademyLayoutContent academyId={id}>{children}</AcademyLayoutContent>
    </Suspense>
  );
}
