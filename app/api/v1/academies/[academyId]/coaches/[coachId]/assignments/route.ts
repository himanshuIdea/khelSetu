import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  validateUnassignPayload,
  validateUpdateCoachAssignmentPayload,
  type UnassignPayload,
  type UpdateCoachAssignmentPayload,
} from "@/lib/coaches";
import {
  listCoachAssignments,
  unassignCoach,
  updateCoachSportAssignment,
} from "@/lib/repositories/coaches";
import {
  assertAcademyCoachAccess,
  handleCoachRouteError,
} from "@/app/api/v1/academies/[academyId]/coaches/_auth";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; coachId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, coachId } = await context.params;
    const accessError = await assertAcademyCoachAccess(academyId);
    if (accessError) return accessError;

    const assignments = await listCoachAssignments(academyId, coachId);
    return NextResponse.json({ assignments });
  } catch (error) {
    return handleCoachRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, coachId } = await context.params;
    const accessError = await assertAcademyCoachAccess(academyId);
    if (accessError) return accessError;

    const body = (await request.json()) as UpdateCoachAssignmentPayload;
    const validationError = validateUpdateCoachAssignmentPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await updateCoachSportAssignment(academyId, coachId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleCoachRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { academyId, coachId } = await context.params;
    const accessError = await assertAcademyCoachAccess(academyId);
    if (accessError) return accessError;

    const body = (await request.json()) as UnassignPayload;
    const validationError = validateUnassignPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await unassignCoach(academyId, coachId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleCoachRouteError(error);
  }
}
