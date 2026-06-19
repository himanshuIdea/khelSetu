import { notFound } from "next/navigation";
import { StatePageBody } from "@/components/state/StatePageBody";
import { SchemeDisbursementWorkspace } from "@/components/state/funds/SchemeDisbursementWorkspace";
import { getSchemeDetailWithBeneficiaries } from "@/lib/repositories/state-funds";
import { getSchemeDefinitionBySlug } from "@/lib/state-fund-schemes";

type SchemeFundsPageProps = {
  params: Promise<{ schemeSlug: string }>;
};

export default async function SchemeFundsPage({ params }: SchemeFundsPageProps) {
  const { schemeSlug } = await params;

  if (!getSchemeDefinitionBySlug(schemeSlug)) {
    notFound();
  }

  const detail = await getSchemeDetailWithBeneficiaries(schemeSlug);
  if (!detail) {
    notFound();
  }

  return (
    <StatePageBody variant="list">
      <SchemeDisbursementWorkspace detail={detail} />
    </StatePageBody>
  );
}
