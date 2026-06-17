import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { searchUnregisteredAcademies } from "@/lib/repositories/state-nurseries";

export const runtime = "nodejs";

loadEnv();

export async function GET(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const results = await searchUnregisteredAcademies(q);

    return NextResponse.json({ results });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
