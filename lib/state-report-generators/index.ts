import type { StateReportType } from "@/lib/state-report-catalog";
import type { StateReportData } from "@/lib/repositories/state-report-data";
import { generateDistrictReport } from "./district-report";
import { generateFundReport } from "./fund-report";
import { generateFullStateReport } from "./full-state-report";
import { generateTalentPipelineReport } from "./talent-pipeline-report";
import { generateVerificationReport } from "./verification-report";
import type { GeneratedReport, ReportFormat } from "./types";

export type { GeneratedReport, ReportFormat } from "./types";

export async function generateStateReport(
  type: StateReportType,
  format: ReportFormat,
  data: StateReportData
): Promise<GeneratedReport> {
  switch (type) {
    case "district-performance":
      return generateDistrictReport(format, data as Parameters<typeof generateDistrictReport>[1]);
    case "fund-utilisation":
      return generateFundReport(format, data as Parameters<typeof generateFundReport>[1]);
    case "talent-pipeline":
      return generateTalentPipelineReport(
        format,
        data as Parameters<typeof generateTalentPipelineReport>[1]
      );
    case "verification-compliance":
      return generateVerificationReport(
        format,
        data as Parameters<typeof generateVerificationReport>[1]
      );
    case "full-state":
      return generateFullStateReport(format, data as Parameters<typeof generateFullStateReport>[1]);
  }
}
