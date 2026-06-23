import { Suspense } from "react";
import { ReportsWorkspace } from "@/components/state/ReportsWorkspace";
import { StatePageBody } from "@/components/state/StatePageBody";
import { StateReportsLoading } from "@/components/state/StateRouteLoading";
import { loadReportsPageData } from "@/lib/repositories/state-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function ReportsPageContent() {
  const { dashboard, reportAvailability, hasPortalData } = await loadReportsPageData();

  return (
    <ReportsWorkspace
      dashboard={dashboard}
      reportAvailability={reportAvailability}
      hasPortalData={hasPortalData}
    />
  );
}

export default function StateReportsPage() {
  return (
    <StatePageBody>
      <Suspense fallback={<StateReportsLoading />}>
        <ReportsPageContent />
      </Suspense>
    </StatePageBody>
  );
}
