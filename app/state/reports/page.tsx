import { ChartIcon } from "@/components/academy/icons";
import {
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import { StatePageBody } from "@/components/state/StatePageBody";
import { StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { getStateReportsDashboard } from "@/lib/repositories/state-reports";
import { STATE_REPORT_CATALOG } from "@/lib/state-report-catalog";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.reports;

export default async function StateReportsPage() {
  const dashboard = await getStateReportsDashboard();
  const hasReports = dashboard.totalExports > 0;

  return (
    <StatePageBody>
      <PageHeader
        title={meta.title}
        subtitle={
          hasReports
            ? `${dashboard.totalExports} exports generated across registered nurseries`
            : "Analytics exports and compliance reports will be available once data is collected"
        }
        actionLabel={hasReports ? meta.actionLabel : undefined}
        actionIcon={<ChartIcon className="w-4 h-4" />}
      />

      <StatGrid>
        <StatCard
          compact
          value={hasReports ? dashboard.generatedThisMonth.toLocaleString("en-IN") : "0"}
          label="Reports generated this month"
        />
        <StatCard
          compact
          value={hasReports ? dashboard.scheduledExports.toLocaleString("en-IN") : "0"}
          label="Report types in use"
        />
        <StatCard
          compact
          value={hasReports ? dashboard.pendingReview.toLocaleString("en-IN") : "0"}
          label="Pending review"
          valueColor={hasReports ? "#C77F12" : undefined}
        />
        <StatCard
          compact
          value={hasReports ? `${dashboard.complianceCoverage}%` : "—"}
          label="Compliance coverage"
          valueColor={hasReports ? "#0E9B72" : undefined}
        />
      </StatGrid>

      <div className="bg-card border border-line rounded-(--radius) px-5 py-4 mt-4 min-w-0">
        <SectionTitle title="Report catalog" subtitle="scheduled and on-demand exports" />
        {hasReports ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
            {STATE_REPORT_CATALOG.map((r) => (
              <div key={r.title} className="border border-line2 rounded-(--radius) px-4 py-3.5">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <SectionTitle title={r.title} subtitle={r.detail} />
                  <Pill variant="grey">{r.tag}</Pill>
                </div>
                <button type="button" className="text-[13px] font-semibold text-brand hover:underline">
                  Generate →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <StateSectionEmpty screen="reports" />
        )}
      </div>
    </StatePageBody>
  );
}
