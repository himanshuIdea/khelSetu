import { CalendarIcon, PinIcon, TrophyIcon } from "@/components/academy/icons";
import {
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  SidePanel,
  SplitLayout,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

type TournamentsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TournamentsPage({ params }: TournamentsPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const tournament = await api.tournaments.active(academy.id);
  const { id: tournamentId } = await api.tournaments.activeId(academy.id);
  const bracketMatches = tournamentId ? await api.tournaments.bracket(tournamentId) : [];
  const matSchedule = tournamentId ? await api.tournaments.matSchedule(tournamentId) : [];

  const qfMatches = bracketMatches
    .filter((m) => m.round === "QF")
    .map((m) => ({
      top: m.playerAName ?? "TBD",
      topScore: String(m.scoreA ?? ""),
      bottom: m.playerBName ?? "TBD",
      bottomScore: String(m.scoreB ?? ""),
      winner:
        m.scoreA != null && m.scoreB != null
          ? m.scoreA > m.scoreB
            ? "top"
            : "bottom"
          : "top",
    }));

  const sfMatches = bracketMatches.filter((m) => m.round === "SF");

  const dateRange = tournament
    ? `${new Date(tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}–${new Date(tournament.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "";

  return (
    <PageBody>
      <PageHeader
        title="Tournaments"
        subtitle="Host inter- and intra-academy events with live brackets and mat scheduling."
        actionLabel="Create tournament"
      />

      {tournament && (
        <div className="bg-card border border-line rounded-(--radius) shadow-card p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-[18px]">
          <div className="w-[54px] h-[54px] rounded-[14px] bg-linear-to-br from-amber to-brand flex items-center justify-center shrink-0">
            <TrophyIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-ink">{tournament.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><PinIcon /> {tournament.location}</span>
              <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {dateRange}</span>
              <span>{tournament.participantAcademies} academies</span>
              <span>{tournament.participantAthletes} athletes</span>
            </div>
          </div>
          <Pill variant="red" className="px-[13px] py-[7px] self-start sm:self-auto">
            <span className="w-[7px] h-[7px] rounded-full bg-red" />
            Live now
          </Pill>
        </div>
      )}

      <SplitLayout>
        <div className="flex-1 min-w-0 bg-card border border-line rounded-(--radius) shadow-card p-5">
          <SectionTitle
            title={`${tournament?.weightClass ?? "65 kg"} · Knockout bracket`}
            subtitle="Quarter-finals → Final"
          />
          <div className="overflow-x-auto -mx-1 px-1 mt-[18px]">
            <div className="flex items-stretch gap-0 text-[11.5px] min-w-[480px]">
              <div className="flex flex-col justify-around gap-3.5 flex-1">
                {qfMatches.map((m) => (
                  <div key={m.top} className="bg-card border border-line rounded-(--radius) overflow-hidden">
                    <div className={`flex justify-between px-2.5 py-2 border-b border-line2 ${m.winner === "top" ? "font-semibold text-ink" : "text-muted"}`}>
                      {m.top} <span className={m.winner === "top" ? "text-green" : ""}>{m.topScore}</span>
                    </div>
                    <div className={`flex justify-between px-2.5 py-2 ${m.winner === "bottom" ? "font-semibold text-ink" : "text-muted"}`}>
                      {m.bottom} <span className={m.winner === "bottom" ? "text-green" : ""}>{m.bottomScore}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-[26px] flex flex-col justify-around">
                <div className="h-0.5 bg-line my-[30px]" />
                <div className="h-0.5 bg-line my-[30px]" />
              </div>
              <div className="flex flex-col justify-around flex-1 gap-3.5">
                {sfMatches.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-card border rounded-(--radius) overflow-hidden ${m.status === "live" ? "border-brand" : "border-line"}`}
                  >
                    <div className={`flex justify-between px-2.5 py-2 border-b border-line2 ${m.status === "live" ? "font-semibold text-ink" : "text-muted"}`}>
                      {m.playerAName}{" "}
                      {m.status === "live" && <span className="text-brand font-bold">live</span>}
                    </div>
                    <div className={`flex justify-between px-2.5 py-2 ${m.status === "live" ? "font-semibold text-ink" : "text-muted"}`}>
                      {m.playerBName}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-[26px] flex items-center">
                <div className="h-0.5 bg-line w-full" />
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div className="bg-ink border-none rounded-(--radius) overflow-hidden text-white">
                  <div className="flex justify-between px-[11px] py-[9px] border-b border-white/12">Winner SF1</div>
                  <div className="flex justify-between px-[11px] py-[9px] text-[#A9B5D1]">Winner SF2</div>
                </div>
                <div className="text-center mt-2.5 text-muted text-[10.5px]">FINAL · Mat 1 · 4:00 PM</div>
              </div>
            </div>
          </div>
        </div>

        <SidePanel>
          <div className="bg-card border border-line rounded-(--radius) shadow-card p-[18px]">
            <SectionTitle title="Mat schedule · today" />
            <div className="flex flex-col gap-[11px] mt-3">
              {matSchedule.map((s) => (
                <div key={s.bout} className="p-[11px] border border-line rounded-[11px]">
                  <div className="flex justify-between gap-2">
                    <Pill variant={s.variant} className="text-[10px]">
                      {s.variant === "red" && <span className="w-[7px] h-[7px] rounded-full bg-red" />}
                      {s.mat}
                    </Pill>
                    <span className="text-[11.5px] text-muted shrink-0">{s.time}</span>
                  </div>
                  <div className="font-semibold text-[12.5px] mt-[7px]">{s.bout}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3.5 border-t border-line2 flex justify-between">
              <div>
                <div className="font-bold text-base text-ink">{academy.initials === "DA" ? "Dronacharya" : academy.name}</div>
                <div className="text-[11.5px] text-muted">Medal tally</div>
              </div>
              <div className="flex gap-2.5 font-bold">
                <span className="text-amber">3<span className="text-[11.5px] text-muted font-normal block">Gold</span></span>
                <span className="text-muted2">2<span className="text-[11.5px] text-muted font-normal block">Silver</span></span>
                <span className="text-[#CD7F32]">4<span className="text-[11.5px] text-muted font-normal block">Bronze</span></span>
              </div>
            </div>
          </div>
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
