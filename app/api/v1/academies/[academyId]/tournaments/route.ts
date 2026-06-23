import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { createTournament } from "@/lib/repositories/tournaments";
import type { CreateTournamentPayload } from "@/lib/tournaments";
import {
  AGE_DIVISIONS,
  COMPETITION_FORMATS,
  PARTICIPATION_SCOPES,
} from "@/lib/tournaments";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

function validatePayload(body: CreateTournamentPayload): string | null {
  if (!body.name?.trim()) return "Tournament name is required.";
  if (!body.location?.trim()) return "Venue is required.";
  if (!body.startDate || !body.endDate) return "Start and end dates are required.";
  if (!PARTICIPATION_SCOPES.includes(body.participationScope)) return "Invalid participation scope.";
  if (!COMPETITION_FORMATS.includes(body.competitionFormat)) return "Invalid competition format.";
  if (!AGE_DIVISIONS.includes(body.ageDivision)) return "Invalid age division.";
  if (!body.sportId) return "Sport is required.";
  if (!Array.isArray(body.participantIds) || body.participantIds.length < 2) {
    return "Select at least two participants.";
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAdminAccess(academyId, { writable: true });

    const body = (await request.json()) as CreateTournamentPayload;
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const tournament = await createTournament(academyId, body);
    return NextResponse.json(
      {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not create tournament.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
