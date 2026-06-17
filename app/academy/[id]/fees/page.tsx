import { FeesWorkspace } from "@/components/academy/FeesWorkspace";
import { PageBody } from "@/components/academy/shared";
import { getFeeBillingStats, getFeeFormOptions, listPlayerFeeBilling } from "@/lib/repositories/fees";
import { getPayrollStats, getStaffMembers } from "@/lib/repositories/payroll";

type FeesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeesPage({ params }: FeesPageProps) {
  const { id } = await params;

  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const [payrollStats, staffMembers, feeStats, billingRows, formOptions] = await Promise.all([
    getPayrollStats(id),
    getStaffMembers(id),
    getFeeBillingStats(id),
    listPlayerFeeBilling(id),
    getFeeFormOptions(id),
  ]);

  return (
    <PageBody>
      <FeesWorkspace
        academyId={id}
        monthLabel={monthLabel}
        payrollStats={payrollStats}
        staffMembers={staffMembers}
        feeStats={feeStats}
        billingRows={billingRows}
        formOptions={formOptions}
      />
    </PageBody>
  );
}
