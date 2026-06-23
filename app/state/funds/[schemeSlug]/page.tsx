import { notFound } from "next/navigation";
import { StatePageBody } from "@/components/state/StatePageBody";
import { SchemeDisbursementWorkspace } from "@/components/state/funds/SchemeDisbursementWorkspace";
import {
  DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE,
  getSchemeDetailHeader,
  listSchemeAthleteNurseryNames,
  listSchemeBeneficiariesPage,
} from "@/lib/repositories/state-funds";
import { getSchemeDefinitionBySlug } from "@/lib/state-fund-schemes";

type SchemeFundsPageProps = {
  params: Promise<{ schemeSlug: string }>;
};

export default async function SchemeFundsPage({ params }: SchemeFundsPageProps) {
  const { schemeSlug } = await params;

  if (!getSchemeDefinitionBySlug(schemeSlug)) {
    notFound();
  }

  const [header, initialList, nurseryNames] = await Promise.all([
    getSchemeDetailHeader(schemeSlug),
    listSchemeBeneficiariesPage(schemeSlug, {
      offset: 0,
      limit: DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE,
    }),
    getSchemeDefinitionBySlug(schemeSlug)?.beneficiaryType === "athlete"
      ? listSchemeAthleteNurseryNames()
      : Promise.resolve([]),
  ]);

  if (!header || !initialList) {
    notFound();
  }

  const nurseryFilterOptions = [
    { value: "all", label: "Nursery: All" },
    ...nurseryNames.map((name) => ({ value: name, label: name })),
  ];

  return (
    <StatePageBody variant="list">
      <SchemeDisbursementWorkspace
        initialHeader={header}
        initialList={initialList}
        nurseryFilterOptions={nurseryFilterOptions}
      />
    </StatePageBody>
  );
}
