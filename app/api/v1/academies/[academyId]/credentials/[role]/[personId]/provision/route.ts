import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import {
  CredentialError,
  type CredentialRoleSegment,
  provisionCredentials,
} from "@/lib/repositories/credentials";

export const runtime = "nodejs";

loadEnv();

const VALID_ROLES: CredentialRoleSegment[] = ["athletes", "coaches", "staff"];

type RouteContext = {
  params: Promise<{ academyId: string; role: string; personId: string }>;
};

function parseRole(role: string): CredentialRoleSegment | null {
  return VALID_ROLES.includes(role as CredentialRoleSegment)
    ? (role as CredentialRoleSegment)
    : null;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { academyId, role, personId } = await context.params;
    await requireAcademyAdminAccess(academyId, { writable: true });

    const segment = parseRole(role);
    if (!segment) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const result = await provisionCredentials(academyId, segment, personId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof CredentialError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not generate credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
