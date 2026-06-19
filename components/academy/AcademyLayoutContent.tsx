import { redirect } from "next/navigation";
import { AcademyLayoutClient } from "@/components/academy/AcademyLayoutClient";
import { isCoachOnlyMember, isPlayerOnlyMember } from "@/lib/auth/membership-access";
import { getSessionUserId } from "@/lib/auth/server";
import { coachRoutes } from "@/lib/coach-nav";
import { playerRoutes } from "@/lib/player-nav";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import { getAcademyNurseryFlag } from "@/lib/repositories/state-nurseries";

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
    if (profile && isCoachOnlyMember(profile)) {
      redirect(coachRoutes.home);
    }
    if (profile && isPlayerOnlyMember(profile)) {
      redirect(playerRoutes.home);
    }
  }

  const academyMeta = await academyMetaPromise;
  const nurseryFlag = await getAcademyNurseryFlag(academyId);

  return (
    <AcademyLayoutClient
      academyId={academyId}
      academyMeta={academyMeta}
      nurseryFlag={nurseryFlag}
    >
      {children}
    </AcademyLayoutClient>
  );
}
