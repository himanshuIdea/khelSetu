import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournamentMatches, tournamentMedals, tournaments } from "@/db/schema";

export async function getActiveTournament(academyId: string) {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")))
    .limit(1);

  if (!tournament) return null;

  return {
    id: tournament.id,
    name: tournament.name,
    location: tournament.location,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    participantAcademies: tournament.participantAcademies ?? 0,
    participantAthletes: tournament.participantAthletes ?? 0,
    weightClass: tournament.weightClass ?? "",
    status: tournament.status,
  };
}

export async function getBracketMatches(tournamentId: string) {
  const rows = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(tournamentMatches.round, tournamentMatches.bracketPosition);

  return rows;
}

export async function getMatSchedule(tournamentId: string) {
  const rows = await db
    .select()
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.tournamentId, tournamentId),
        sql`${tournamentMatches.matLabel} is not null`
      )
    )
    .orderBy(tournamentMatches.scheduledAt);

  return rows.map((row) => {
    const variant =
      row.status === "live" ? "red" : row.status === "scheduled" ? "grey" : "amber";
    const time = row.scheduledAt
      ? row.scheduledAt.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

    const bout =
      row.playerAName && row.playerBName
        ? `${row.round} · ${row.playerAName} vs ${row.playerBName}`
        : row.round;

    return {
      mat: row.matLabel ?? "Mat",
      time,
      bout,
      variant: variant as "red" | "grey" | "amber",
    };
  });
}

export async function getTournamentMedals(tournamentId: string, academyId: string) {
  const [medals] = await db
    .select()
    .from(tournamentMedals)
    .where(
      and(eq(tournamentMedals.tournamentId, tournamentId), eq(tournamentMedals.academyId, academyId))
    )
    .limit(1);

  return {
    gold: medals?.gold ?? 0,
    silver: medals?.silver ?? 0,
    bronze: medals?.bronze ?? 0,
  };
}

export async function getActiveTournamentId(academyId: string) {
  const [tournament] = await db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")))
    .limit(1);

  return tournament?.id ?? null;
}
