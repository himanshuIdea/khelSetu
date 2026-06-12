import { ChartIcon } from "@/components/academy/icons";
import {
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.reports;

const reportTypes = [
  { title: "District performance summary", detail: "Athletes, nurseries, verification by district", tag: "Monthly" },
  { title: "Fund utilisation report", detail: "Scheme-wise DBT disbursement and pending approvals", tag: "FY 2025-26" },
  { title: "Talent pipeline export", detail: "Khelo India shortlist and scouting scores", tag: "Quarterly" },
  { title: "Verification compliance", detail: "Flagged nurseries and audit trail", tag: "On demand" },
];

export default function StateReportsPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} actionIcon={<ChartIcon className="w-4 h-4" />} />

      <StatGrid>
        <StatCard compact value="24" label="Reports generated this month" />
        <StatCard compact value="6" label="Scheduled exports" />
        <StatCard compact value="3" label="Pending review" valueColor="#C77F12" />
        <StatCard compact value="100%" label="Compliance coverage" valueColor="#0E9B72" />
      </StatGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
        {reportTypes.map((r) => (
          <div key={r.title} className="bg-card border border-line rounded-(--radius) px-5 py-4">
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
    </PageBody>
  );
}
