import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  generateShortlistReport,
  type ShortlistReportFormat,
} from "@/lib/scouting-shortlist-report";
import { listShortlistReportRows } from "@/lib/repositories/state-scouting";

export const runtime = "nodejs";

loadEnv();

export async function POST(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { format?: string };
    const format: ShortlistReportFormat = body.format === "pdf" ? "pdf" : "xlsx";

    const rows = await listShortlistReportRows();
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No shortlisted athletes to include in the report." },
        { status: 400 }
      );
    }

    const { buffer, filename, mimeType } = await generateShortlistReport(format, rows);

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
