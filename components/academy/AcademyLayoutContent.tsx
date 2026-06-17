import { redirect } from "next/navigation";
import { AcademyLayoutClient } from "@/components/academy/AcademyLayoutClient";
import { isCoachOnlyMember, isPlayerOnlyMember } from "@/lib/auth/membership-access";
import { getSessionUserId } from "@/lib/auth/server";
import { coachRoutes } from "@/lib/coach-nav";
import { playerRoutes } from "@/lib/player-nav";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

type AcademyLayoutContentProps = {
  academyId: string;
  children: React.ReactNode;
};

export async function AcademyLayoutContent({ academyId, children }: AcademyLayoutContentProps) {
  const userId = await getSessionUserId();
  if (userId) {
    const profile = await getAuthProfile(userId);
    if (profile && isCoachOnlyMember(profile)) {
      redirect(coachRoutes.home);
    }
    if (profile && isPlayerOnlyMember(profile)) {
      redirect(playerRoutes.home);
    }
  }

  const academyMeta = await resolveAcademy(academyId);

  return (
    <AcademyLayoutClient academyId={academyId} academyMeta={academyMeta}>
      {children}
    </AcademyLayoutClient>
  );
}
