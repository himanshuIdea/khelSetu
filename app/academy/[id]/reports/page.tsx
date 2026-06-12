import { ChartIcon } from "@/components/academy/icons";
import {
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

const reportTypes = [
  { title: "Fee collection report", detail: "Monthly collections, dues and payment status by player", tag: "Monthly" },
  { title: "Attendance summary", detail: "Session attendance by batch, coach and sport", tag: "Weekly" },
  { title: "Coach performance", detail: "Drill reviews, ratings and pending video queue", tag: "Monthly" },
  { title: "Tournament results", detail: "Medal tally, bracket outcomes and squad performance", tag: "On demand" },
  { title: "Inventory movement", detail: "Gear issued, returned and stock levels", tag: "Monthly" },
  { title: "Payroll export", detail: "Staff days present, salary and disbursement status", tag: "Monthly" },
];

type ReportsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  return (
    <PageBody>
      <PageHeader
        title="Reports"
        subtitle={`${academy.name} · analytics, exports and compliance`}
        actionLabel="Generate report"
        actionIcon={<ChartIcon className="w-4 h-4" />}
      />

      <StatGrid>
        <StatCard compact value="18" label="Reports this month" />
        <StatCard compact value="4" label="Scheduled exports" />
        <StatCard compact value="2" label="Pending review" valueColor="#C77F12" />
        <StatCard compact value="100%" label="Fee compliance" valueColor="#0E9B72" />
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
