import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { tournaments } from "@/db/schema";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { moveTournamentMatchAthlete } from "@/lib/repositories/tournaments";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ tournamentId: string }>;
};

type MoveAthleteBody = {
  from: { matchId: string; side: "a" | "b" };
  to: { matchId: string; side: "a" | "b" };
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { tournamentId } = await context.params;
    const body = (await request.json()) as MoveAthleteBody;

    const [tournament] = await db
      .select({ academyId: tournaments.academyId })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    await requireAcademyAdminAccess(tournament.academyId);

    const result = await moveTournamentMatchAthlete(tournamentId, body.from, body.to);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not move athlete.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
