import { CheckIcon, FlagIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

function FormBadge({ result }: { result: string }) {
  const isWin = result === "W";
  return (
    <span
      className="w-[18px] h-[18px] rounded-[5px] text-[9px] font-bold inline-flex items-center justify-center text-white"
      style={{ background: isWin ? "#12B886" : "#EF4444" }}
    >
      {result}
    </span>
  );
}

type TeamsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const featuredTeam = await api.teams.featured(academy.id).catch(() => null);
  const teamMembers = await api.teams.members(academy.id);
  const otherTeams = await api.teams.others(academy.id, featuredTeam?.id);

  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Teams & Squads"
            subtitle="Build squads, name captains and pick line-ups for tournaments."
            actionLabel="Create team"
          />

          {featuredTeam && (
            <div className="bg-linear-to-br from-ink to-ink3 text-white rounded-(--radius) shadow-card p-5 mb-4 border-none">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-[52px] h-[52px] rounded-[14px] bg-white/12 flex items-center justify-center shrink-0">
                    <FlagIcon className="w-[26px] h-[26px] text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-bold">{featuredTeam.name}</div>
                    <div className="text-[12.5px] text-[#A9B5D1] mt-[3px]">
                      Coach {featuredTeam.coach} · created{" "}
                      {new Date(featuredTeam.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                      {featuredTeam.memberCount} members
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex -space-x-2 shrink-0">
                  {featuredTeam.avatars.map((a) => (
                    <div
                      key={a.initials}
                      className="w-[30px] h-[30px] rounded-[9px] border-2 border-ink3 flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: a.color }}
                    >
                      {a.initials}
                    </div>
                  ))}
                  {featuredTeam.memberCount > featuredTeam.avatars.length && (
                    <div className="w-[30px] h-[30px] rounded-[9px] border-2 border-ink3 flex items-center justify-center text-[11px] font-bold text-white bg-[#7C5CFC]">
                      +{featuredTeam.memberCount - featuredTeam.avatars.length}
                    </div>
                  )}
                </div>
                <div className="sm:text-right sm:border-l sm:border-white/14 sm:pl-[18px] shrink-0">
                  <div className="text-[11px] text-[#A9B5D1]">Next fixture</div>
                  <div className="text-[13px] font-semibold mt-0.5">Inter-Academy Meet</div>
                  <div className="text-[11.5px] text-brand mt-px">12 Mar · Sonipat</div>
                </div>
              </div>
            </div>
          )}

          <AcademyTable headers={["Member", "Weight", "Role", "Recent form", "Selection"]} minWidth={560}>
            {teamMembers.map((m) => (
              <TableRow key={m.initials}>
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <Avatar initials={m.initials} color={m.avatarColor} />
                    <div className="font-semibold text-[13px] text-ink">{m.name}</div>
                  </div>
                </TableCell>
                <TableCell>{m.weight}</TableCell>
                <TableCell><Pill variant={m.roleVariant}>{m.role}</Pill></TableCell>
                <TableCell>
                  <span className="inline-flex gap-[3px]">
                    {m.form.map((f, i) => (
                      <FormBadge key={`${m.initials}-${i}`} result={f} />
                    ))}
                  </span>
                </TableCell>
                <TableCell>
                  <Pill variant={m.selectionVariant}>
                    {m.selectionVariant === "green" && <CheckIcon />}
                    {m.selection}
                  </Pill>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </div>

        <SidePanel className="flex flex-col gap-3.5">
          <div className="bg-card border border-line rounded-(--radius) shadow-card p-4">
            <SectionTitle title="Other teams" />
            {otherTeams.map((t, i) => (
              <div key={t.name} className={`flex gap-[11px] items-center py-2.5 ${i < otherTeams.length - 1 ? "border-b border-line2" : ""}`}>
                <Avatar initials={t.initials} color={t.color} className="rounded-[10px]" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]">{t.name}</div>
                  <div className="text-[11.5px] text-muted">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-soft border border-[#FFD9C5] rounded-(--radius) shadow-card p-4">
            <SectionTitle title="Auto line-up suggestion" />
            <p className="text-[11.5px] text-[#9a5a3a] leading-relaxed mt-1">
              Based on recent form & ratings, KhelSetu suggests{" "}
              <b className="text-brand-d">11 athletes</b> for the Inter-Academy Meet.
            </p>
            <button type="button" className="w-full mt-3 inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]">
              Review suggestion
            </button>
          </div>
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
