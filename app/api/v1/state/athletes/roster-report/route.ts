import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { listStateAthleteReportRows } from "@/lib/repositories/state-athletes";
import { STATE_ATHLETE_ROSTER_REPORT_MAX_ROWS, type StateAthleteFilters } from "@/lib/state-portal";
import {
  generateAthletesRosterReport,
  type AthletesRosterReportFormat,
} from "@/lib/state-athletes-roster-report";

export const runtime = "nodejs";
export const maxDuration = 60;

loadEnv();

type RosterReportBody = {
  format?: string;
  sport?: string;
  district?: string;
  minRating?: number;
  search?: string;
};

function parseBodyFilters(body: RosterReportBody): StateAthleteFilters {
  const filters: StateAthleteFilters = {};
  if (body.sport) filters.sport = body.sport;
  if (body.district) filters.district = body.district;
  if (body.search?.trim()) filters.search = body.search.trim();
  if (body.minRating != null && !Number.isNaN(body.minRating)) {
    filters.minRating = body.minRating;
  }
  return filters;
}

export async function POST(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as RosterReportBody;
    const format: AthletesRosterReportFormat = body.format === "pdf" ? "pdf" : "xlsx";
    const filters = parseBodyFilters(body);

    const rows = await listStateAthleteReportRows(filters);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No athletes match the current filters." },
        { status: 400 }
      );
    }

    if (rows.length > STATE_ATHLETE_ROSTER_REPORT_MAX_ROWS) {
      return NextResponse.json(
        {
          error: `Too many athletes (${rows.length}). Narrow filters to ${STATE_ATHLETE_ROSTER_REPORT_MAX_ROWS} or fewer.`,
        },
        { status: 400 }
      );
    }

    const { buffer, filename, mimeType } = await generateAthletesRosterReport(format, rows, filters);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
