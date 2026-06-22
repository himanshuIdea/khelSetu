import { ReportsWorkspace } from "@/components/state/ReportsWorkspace";
import { StatePageBody } from "@/components/state/StatePageBody";
import { getStateReportsDashboard } from "@/lib/repositories/state-reports";
import {
  getStateReportAvailability,
  statePortalHasAnyData,
} from "@/lib/repositories/state-report-data";
import { STATE_REPORT_TYPES } from "@/lib/state-report-catalog";

export default async function StateReportsPage() {
  const [dashboardBase, reportAvailability, hasPortalData] = await Promise.all([
    getStateReportsDashboard(),
    getStateReportAvailability(),
    statePortalHasAnyData(),
  ]);

  const dashboard = {
    ...dashboardBase,
    scheduledExports: STATE_REPORT_TYPES.filter((type) => reportAvailability[type]).length,
  };

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
