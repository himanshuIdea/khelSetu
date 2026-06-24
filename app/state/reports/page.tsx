import { ReportsWorkspace } from "@/components/state/ReportsWorkspace";
import { StatePageBody } from "@/components/state/StatePageBody";
import { loadReportsPageData } from "@/lib/repositories/state-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export default async function StateReportsPage() {
  const { dashboard, reportAvailability, hasPortalData } = await loadReportsPageData();

  return (
    <StatePageBody>
      <ReportsWorkspace
        dashboard={dashboard}
        reportAvailability={reportAvailability}
        hasPortalData={hasPortalData}
      />
    </StatePageBody>
  );
}
