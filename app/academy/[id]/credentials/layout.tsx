import { redirect } from "next/navigation";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";

export default async function CredentialsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireAcademyAdminAccess(id);
  } catch (error) {
    if (error instanceof AcademyAdminAccessError && error.status === 403) {
      redirect(`/academy/${id}/dashboard`);
    }
    redirect("/auth/login");
  }

  return children;
}
