import { GearWorkspace } from "@/components/academy/GearWorkspace";
import { PageBody } from "@/components/academy/shared";
import {
  getGearFormOptions,
  getGearMovements,
  getInventoryItems,
  getInventoryStats,
  listOpenGearIssues,
} from "@/lib/repositories/inventory";

type GearPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GearPage({ params }: GearPageProps) {
  const { id } = await params;

  const [inventoryStats, inventoryItems, gearMovements, openIssues, formOptions] =
    await Promise.all([
      getInventoryStats(id),
      getInventoryItems(id),
      getGearMovements(id),
      listOpenGearIssues(id),
      getGearFormOptions(id),
    ]);

  return (
    <PageBody>
      <GearWorkspace
        academyId={id}
        inventoryStats={inventoryStats}
        inventoryItems={inventoryItems}
        gearMovements={gearMovements}
        openIssues={openIssues}
        formOptions={formOptions}
      />
    </PageBody>
  );
}
