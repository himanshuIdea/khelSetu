import { redirect } from "next/navigation";
import { AcademyLayoutClient } from "@/components/academy/AcademyLayoutClient";
import { isCoachOnlyMember, isPlayerOnlyMember } from "@/lib/auth/membership-access";
import { getSessionUserId } from "@/lib/auth/server";
import { coachRoutes } from "@/lib/coach-nav";
import { playerRoutes } from "@/lib/player-nav";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import {
  getAcademyDeregistrationState,
  getAcademyNurseryFlag,
} from "@/lib/repositories/state-nurseries";

type AcademyLayoutContentProps = {
  academyId: string;
  children: React.ReactNode;
};

export async function AcademyLayoutContent({ academyId, children }: AcademyLayoutContentProps) {
  const userId = await getSessionUserId();
  const academyMetaPromise = resolveAcademy(academyId);

  if (userId) {
    const profile = await getAuthProfile(userId);
    if (profile && profile.needsAcademyOnboarding) {
      redirect("/auth/onboarding");
    }
    const isAdminOfAcademy = profile?.academies.some(
      (academy) => academy.id === academyId && academy.role === MEMBERSHIP_ROLES.ADMIN
    );
    if (profile?.requiresNurseryReregistration && isAdminOfAcademy) {
      redirect("/auth/onboarding");
    }
    if (profile && isCoachOnlyMember(profile)) {
      redirect(coachRoutes.home);
    }
    if (profile && isPlayerOnlyMember(profile)) {
      redirect(playerRoutes.home);
    }
  }

  const academyMeta = await academyMetaPromise;
  const [nurseryFlag, nurseryDeregistration] = await Promise.all([
    getAcademyNurseryFlag(academyId),
    getAcademyDeregistrationState(academyId),
  ]);

  return (
    <AcademyLayoutClient
      academyId={academyId}
      academyMeta={academyMeta}
      nurseryFlag={nurseryFlag}
      nurseryDeregistered={Boolean(nurseryDeregistration)}
    >
      {children}
    </AcademyLayoutClient>
  );
}
