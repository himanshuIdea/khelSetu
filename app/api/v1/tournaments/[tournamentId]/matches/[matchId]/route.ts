import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db";
import { tournaments } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { updateTournamentMatch } from "@/lib/repositories/tournaments";
import type { UpdateTournamentMatchPayload } from "@/lib/tournaments";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ tournamentId: string; matchId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { tournamentId, matchId } = await context.params;
    const body = (await request.json()) as UpdateTournamentMatchPayload;

    const [tournament] = await db
      .select({ academyId: tournaments.academyId })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    await requireAcademyAdminAccess(tournament.academyId);

    const match = await updateTournamentMatch(tournamentId, matchId, body);
    return NextResponse.json({ match });
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not update match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
