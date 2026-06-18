import { PageBody } from "@/components/academy/shared";
import { AcademyOnboardingRequestsWorkspace } from "@/components/state/AcademyOnboardingRequestsWorkspace";
import { listStateOnboardingRequests } from "@/lib/repositories/academy-onboarding";

export default async function AcademyOnboardingRequestsPage() {
  const requests = await listStateOnboardingRequests();

  return (
    <PageBody>
      <AcademyOnboardingRequestsWorkspace requests={requests} />
    </PageBody>
  );
}
