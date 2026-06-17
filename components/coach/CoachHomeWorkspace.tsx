import Link from "next/link";
import { CapIcon } from "@/components/academy/icons";
import { PageBody, PageHeader, Pill, StatCard, StatGrid } from "@/components/academy/shared";
import { coachRoutes } from "@/lib/coach-nav";
import type { CoachHomeSummary } from "@/lib/repositories/coaches";

type CoachHomeWorkspaceProps = {
  academyId: string;
  summary: CoachHomeSummary;
};

export function CoachHomeWorkspace({ summary }: CoachHomeWorkspaceProps) {
  const { coach, assignments, totalPlayers, batchCount } = summary;

  return (
    <PageBody>
      <PageHeader
        title="My assignments"
        subtitle={`${batchCount} batch${batchCount === 1 ? "" : "es"} · ${totalPlayers} player${totalPlayers === 1 ? "" : "s"} under your coaching.`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 p-4 sm:p-5 bg-card border border-line rounded-(--radius) shadow-card">
        <div
          className="w-12 h-12 rounded-[13px] flex items-center justify-center font-bold text-white text-base shrink-0"
          style={{ background: coach.avatarColor }}
        >
          {coach.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-ink">{coach.name}</div>
          <div className="text-[12.5px] text-muted">{coach.role}</div>
        </div>
        <Pill variant="blue">
          <CapIcon className="w-3 h-3" />
          {coach.badgeLabel}
        </Pill>
      </div>

      <StatGrid>
        <StatCard
          value={String(totalPlayers)}
          label="Players"
          iconBg="var(--brand-soft)"
          iconColor="var(--brand-d)"
        />
        <StatCard
          value={String(batchCount)}
          label="Batches assigned"
          iconBg="var(--blue-soft)"
          iconColor="#2756D8"
        />
        <StatCard
          value={String(coach.drillsPerWeek)}
          label="Drills · wk"
          iconBg="var(--green-soft)"
          iconColor="#0E9B72"
        />
        <StatCard
          value={coach.rating > 0 ? coach.rating.toFixed(1) : "—"}
          label="Rating"
          iconBg="var(--amber-soft)"
          iconColor="#C77F12"
        />
      </StatGrid>

      {assignments.length === 0 ? (
        <div className="bg-card border border-line rounded-(--radius) shadow-card p-6 text-center">
          <div className="text-[15px] font-semibold text-ink">No batch assignments yet</div>
          <p className="text-[13px] text-muted mt-2 max-w-md mx-auto">
            Your academy admin will assign you to sport batches. Check back once assignments are
            synced.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {assignments.map((group) => (
            <section key={group.sportId} className="min-w-0">
              <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-3">
                {group.sportName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {group.batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-[18px]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[14.5px] text-ink truncate">{batch.name}</div>
                        <div className="text-[12px] text-muted">{group.sportName}</div>
                      </div>
                      {batch.isPrimary && <Pill variant="brand">Primary</Pill>}
                    </div>
                    <div className="flex items-end justify-between pt-3 border-t border-line2">
                      <div>
                        <div className="text-[15px] font-bold text-ink">{batch.playerCount}</div>
                        <div className="text-[11.5px] text-muted">Players</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`${coachRoutes.players}?batch=${batch.id}`}
                          className="text-[12px] font-semibold text-brand-d hover:underline min-h-[44px] inline-flex items-center"
                        >
                          View players
                        </Link>
                        <Link
                          href={`${coachRoutes.attendance}?batch=${batch.id}`}
                          className="text-[12px] font-semibold text-muted hover:text-ink min-h-[44px] inline-flex items-center"
                        >
                          Mark attendance
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={coachRoutes.players}
          className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] min-h-[44px]"
        >
          All players
        </Link>
        <Link
          href={coachRoutes.teams}
          className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line min-h-[44px]"
        >
          My teams
        </Link>
      </div>
    </PageBody>
  );
}
