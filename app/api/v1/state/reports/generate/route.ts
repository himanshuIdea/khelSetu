import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { isStateReportType } from "@/lib/state-report-catalog";
import {
  emptyReportMessage,
  fetchStateReportData,
  reportDataHasContent,
} from "@/lib/repositories/state-report-data";
import { recordStateReportExport } from "@/lib/repositories/state-reports";
import {
  generateStateReport,
  type ReportFormat,
} from "@/lib/state-report-generators";

export const runtime = "nodejs";

loadEnv();

export async function POST(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { reportType?: string; format?: string };

    if (!body.reportType || !isStateReportType(body.reportType)) {
      return NextResponse.json({ error: "Invalid report type." }, { status: 400 });
    }

    const format: ReportFormat = body.format === "pdf" ? "pdf" : "xlsx";
    const reportType = body.reportType;

    const data = await fetchStateReportData(reportType);
    if (!reportDataHasContent(reportType, data)) {
      return NextResponse.json({ error: emptyReportMessage(reportType) }, { status: 400 });
    }

    const { buffer, filename, mimeType } = await generateStateReport(reportType, format, data);

    await recordStateReportExport(reportType, format, auth.userId);

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
