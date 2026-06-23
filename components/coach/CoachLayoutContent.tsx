import { CoachShellClient } from "@/components/coach/CoachShellClient";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { getCoachPortalMeta } from "@/lib/repositories/coaches";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import { isAcademyNurseryDeregistered } from "@/lib/repositories/state-nurseries";

type CoachLayoutContentProps = {
  children: React.ReactNode;
};

export async function CoachLayoutContent({ children }: CoachLayoutContentProps) {
  const { academyId, coachId } = await requireCoachAccess();

  const [academyMeta, coachMeta, nurseryDeregistered] = await Promise.all([
    resolveAcademy(academyId),
    getCoachPortalMeta(academyId, coachId),
    isAcademyNurseryDeregistered(academyId),
  ]);

  return (
    <CoachShellClient
      academyId={academyId}
      academyMeta={academyMeta}
      coachMeta={coachMeta}
      nurseryDeregistered={nurseryDeregistered}
    >
      {children}
    </CoachShellClient>
  );
}
