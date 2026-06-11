import {
  ActivityRow,
  AcademyTable,
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { BellIcon, BoxIcon, CheckIcon, UpIcon } from "@/components/academy/icons";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

type GearPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GearPage({ params }: GearPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const [inventoryStats, inventoryItems, gearMovements] = await Promise.all([
    api.inventory.stats(academy.id),
    api.inventory.items(academy.id),
    api.inventory.movements(academy.id),
  ]);

  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Sports Gear & Inventory"
            subtitle="Track every kit, issue and return — know exactly where each item is."
            actionLabel="Add item"
          />

          <StatGrid>
            {inventoryStats.map((s) => (
              <StatCard
                key={s.label}
                value={s.value}
                label={s.label}
                compact
                valueColor={s.color}
              />
            ))}
          </StatGrid>

          <AcademyTable headers={["Item", "Category", "In stock", "Issued", "Condition", "Status"]} minWidth={640}>
            {inventoryItems.map((item) => (
              <TableRow key={item.name}>
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <div
                      className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0"
                      style={{ background: item.iconBg, color: item.iconColor }}
                    >
                      <BoxIcon className="w-[17px] h-[17px]" />
                    </div>
                    <div className="font-semibold text-[13px] text-ink">{item.name}</div>
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><b>{item.inStock}</b></TableCell>
                <TableCell>{item.issued}</TableCell>
                <TableCell><Pill variant={item.conditionVariant}>{item.condition}</Pill></TableCell>
                <TableCell><Pill variant={item.statusVariant}>{item.status}</Pill></TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </div>

        <SidePanel className="flex flex-col gap-3.5">
          <div className="bg-ink border-none rounded-(--radius) shadow-card p-[18px] text-white">
            <div className="text-sm font-bold mb-1">Issue gear</div>
            <div className="text-[11.5px] text-[#A9B5D1] mb-3.5">Assign kit to a player or team in two taps.</div>
            <div className="w-full rounded-[11px] px-[15px] py-[13px] text-[13.5px] bg-white/8 text-[#C7D0E6] mb-2.5">Select player…</div>
            <div className="w-full rounded-[11px] px-[15px] py-[13px] text-[13.5px] bg-white/8 text-[#C7D0E6] mb-3.5">Select item & qty…</div>
            <button type="button" className="w-full inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]">
              Issue now
            </button>
          </div>

          <div className="bg-card border border-line rounded-(--radius) shadow-card p-[18px]">
            <SectionTitle title="Recent movement" />
            {gearMovements.map((m) => {
              const icons = { up: UpIcon, check: CheckIcon, bell: BellIcon };
              const colors = {
                up: { bg: "var(--brand-soft)", color: "var(--brand-d)" },
                check: { bg: "var(--green-soft)", color: "#0E9B72" },
                bell: { bg: "var(--red-soft)", color: "#D63B3B" },
              };
              const Icon = icons[m.type];
              const c = colors[m.type];
              return (
                <ActivityRow
                  key={m.time}
                  icon={<Icon />}
                  iconBg={c.bg}
                  iconColor={c.color}
                  text={
                    m.prefix ? (
                      <>{m.text} <b className="font-semibold text-ink">{m.bold}</b></>
                    ) : (
                      <><b className="font-semibold text-ink">{m.bold}</b> {m.text}</>
                    )
                  }
                  time={m.time}
                />
              );
            })}
          </div>
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
