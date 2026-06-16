import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(_request: Request, _context: RouteContext) {
  return NextResponse.json(
    {
      error:
        "Coach onboarding has moved to Fees → Manage staff. Use POST .../coaches/assign to assign sport and batches.",
    },
    { status: 410 }
  );
}
