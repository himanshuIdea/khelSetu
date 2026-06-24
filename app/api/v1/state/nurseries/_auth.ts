import { NextResponse } from "next/server";
import { AuthRequiredError, getSessionTokenPayload } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";

export async function assertStateAdminAccess() {
  const session = await getSessionTokenPayload();
  if (!session?.sub) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!isStateAdmin(session.platformRole)) {
    return {
      error: NextResponse.json(
        { error: "Only state administrators can access this resource." },
        { status: 403 }
      ),
    };
  }

  return { userId: session.sub };
}

export function handleStateRouteError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  console.error("[state-api]", error);

  const message = error instanceof Error ? error.message : "State request failed.";
  return NextResponse.json({ error: message }, { status: 500 });
}
