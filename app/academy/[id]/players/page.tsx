import { DotsIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageBody,
  PageHeader,
  Pill,
  SidePanel,
  SplitLayout,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

const filters = ["All sports", "Batch: Sub-junior", "Fees: All", "Status: Active"];

type PlayersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const [players, counts, selectedPlayer] = await Promise.all([
    api.players.list(academy.id),
    api.players.counts(academy.id),
    api.players.detail(academy.id, "HRWR-1042").catch(() => null),
  ]);

  return (
    <PageBody className="lg:pr-0">
      <SplitLayout>
        <div className="flex-1 min-w-0 lg:pr-[26px]">
          <PageHeader
            title="Players"
            subtitle={`${counts.active} active · ${counts.onHold} on hold · onboard, track and manage every athlete.`}
            actionLabel="Add player"
          />

          <FilterPills>
            {filters.map((f, i) => (
              <Pill key={f} variant={i === 0 ? "brand" : "grey"} className="px-[13px] py-2 shrink-0">
                {f}
              </Pill>
            ))}
          </FilterPills>

          <AcademyTable headers={["Player", "Sport · Batch", "Fees", "Attendance", "Status", ""]} minWidth={700}>
            {players.map((p) => (
              <TableRow key={p.id} highlighted={p.highlighted}>
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <Avatar initials={p.initials} color={p.avatarColor} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{p.name}</div>
                      <div className="text-[11px] text-muted">{p.id} · {p.age}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {p.sport} · {p.weight}
                  <div className="text-[11px] text-muted">{p.batch}</div>
                </TableCell>
                <TableCell>
                  <Pill variant={p.feesVariant}>{p.fees}</Pill>
                </TableCell>
                <TableCell><b>{p.attendance}</b></TableCell>
                <TableCell>
                  <Pill variant={p.statusVariant}>
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: p.statusVariant === "green" ? "#12B886" : "#F5A623" }} />
                    {p.status}
                  </Pill>
                </TableCell>
                <TableCell>
                  <DotsIcon className="text-muted2" />
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </div>

        {selectedPlayer && (
          <SidePanel>
            <div className="bg-card border border-line lg:border-r-0 rounded-(--radius) lg:rounded-l-(--radius) shadow-card px-[22px] py-6">
              <div className="flex flex-col items-center text-center pb-[18px] border-b border-line2">
                <Avatar initials={selectedPlayer.initials} color="linear-gradient(135deg, #FF6B2C, #FF9152)" size="lg" />
                <div className="text-[17px] font-bold text-ink mt-3">{selectedPlayer.name}</div>
                <div className="text-[11.5px] text-muted">{selectedPlayer.id} · {selectedPlayer.sport}</div>
                <div className="flex flex-wrap justify-center gap-[7px] mt-[11px]">
                  <Pill variant="green">
                    <span className="w-[7px] h-[7px] rounded-full bg-green" />
                    Active
                  </Pill>
                  <Pill variant="brand">Sub-junior</Pill>
                </div>
              </div>

              <div className="flex justify-between py-4 border-b border-line2">
                {[
                  { v: selectedPlayer.rating, l: "Rating" },
                  { v: selectedPlayer.attendance, l: "Attendance" },
                  { v: selectedPlayer.boutsWon, l: "Bouts won" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-[19px] font-bold text-ink">{s.v}</div>
                    <div className="text-[11.5px] text-muted">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="py-4 text-[12.5px] text-text space-y-[11px]">
                <div className="flex justify-between"><span className="text-muted">Joined</span><b>{selectedPlayer.joined}</b></div>
                <div className="flex justify-between"><span className="text-muted">Coach</span><b>{selectedPlayer.coach}</b></div>
                <div className="flex justify-between"><span className="text-muted">Monthly fee</span><b>{selectedPlayer.monthlyFee}</b></div>
                <div className="flex justify-between items-center"><span className="text-muted">Fee status</span><Pill variant="green">Paid till Jun</Pill></div>
              </div>

              <div className="flex flex-col gap-[9px] mt-1">
                <button type="button" className="w-full inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]">View full profile</button>
                <button type="button" className="w-full inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line">Record fee payment</button>
                <button type="button" className="w-full inline-flex items-center justify-center bg-card text-red font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-[#F6D4D4]">Deboard player</button>
              </div>
            </div>
          </SidePanel>
        )}
      </SplitLayout>
    </PageBody>
  );
}
