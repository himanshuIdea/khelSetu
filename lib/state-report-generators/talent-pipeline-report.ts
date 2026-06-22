import { generateShortlistReport } from "@/lib/scouting-shortlist-report";
import type { TalentPipelineReportData } from "@/lib/repositories/state-report-data";
import type { GeneratedReport, ReportFormat } from "./types";

export async function generateTalentPipelineReport(
  format: ReportFormat,
  data: TalentPipelineReportData
): Promise<GeneratedReport> {
  const result = await generateShortlistReport(format, data.rows);
  return {
    buffer: result.buffer,
    filename: result.filename.replace(
      "khelo-india-shortlist",
      "talent-pipeline"
    ),
    mimeType: result.mimeType,
  };
}
