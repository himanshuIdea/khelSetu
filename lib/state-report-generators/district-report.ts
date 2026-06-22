import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { DistrictReportData } from "@/lib/repositories/state-report-data";
import {
  addXlsxSheet,
  createPdfTableContext,
  drawPdfTableHeader,
  drawPdfTableRows,
  pdfBufferFromDocument,
  pdfResult,
  reportDateStamp,
  workbookToBuffer,
  writePdfSectionHeader,
  xlsxResult,
} from "./shared";
import type { GeneratedReport, ReportFormat } from "./types";

const HEADERS = ["District", "Nurseries", "Athletes", "Verified", "Coaches"] as const;

function districtRows(data: DistrictReportData): string[][] {
  return data.districts.map((d) => [
    d.name,
    String(d.nurseries),
    String(d.athleteCount),
    d.verified,
    String(d.coaches),
  ]);
}

export async function generateDistrictReport(
  format: ReportFormat,
  data: DistrictReportData
): Promise<GeneratedReport> {
  const rows = districtRows(data);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Khel Setu";
    workbook.created = new Date();
    addXlsxSheet(workbook, "District performance", [...HEADERS], rows);
    const buffer = await workbookToBuffer(workbook);
    return xlsxResult(buffer, "district-performance");
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  writePdfSectionHeader(
    doc,
    "District Performance Summary",
    `Generated ${reportDateStamp()} · ${data.districts.length} districts`
  );

  const ctx = createPdfTableContext(doc, [120, 70, 70, 120, 70]);
  drawPdfTableHeader(ctx, [...HEADERS]);
  drawPdfTableRows(ctx, [...HEADERS], rows);

  const { buffer } = await pdfBufferFromDocument(doc, "district-performance.pdf");
  return pdfResult(buffer, "district-performance");
}
