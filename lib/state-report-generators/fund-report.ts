import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { FundReportData } from "@/lib/repositories/state-report-data";
import {
  beneficiaryDetailRowsForReport,
  dashboardSummaryRowsForReport,
  schemeSummaryRowsForReport,
} from "./fund-report-rows";
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

const SCHEME_HEADERS = [
  "Scheme",
  "Beneficiary type",
  "Allocated",
  "Disbursed",
  "Utilisation %",
  "Beneficiaries",
] as const;

const BENEFICIARY_HEADERS = [
  "Scheme",
  "Name",
  "District",
  "Nursery",
  "Sport / detail",
  "Grant status",
  "Grant amount",
] as const;

export async function generateFundReport(
  format: ReportFormat,
  data: FundReportData
): Promise<GeneratedReport> {
  const summaryRows = schemeSummaryRowsForReport(data);
  const beneficiaryDetailRows = beneficiaryDetailRowsForReport(data);
  const fySummary = dashboardSummaryRowsForReport(data);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Khel Setu";
    workbook.created = new Date();

    addXlsxSheet(workbook, "FY Summary", ["Metric", "Value"], fySummary);
    addXlsxSheet(workbook, "Funds Summary", [...SCHEME_HEADERS], summaryRows);
    addXlsxSheet(workbook, "Funds Beneficiaries", [...BENEFICIARY_HEADERS], beneficiaryDetailRows);

    const buffer = await workbookToBuffer(workbook);
    return xlsxResult(buffer, "fund-utilisation");
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  writePdfSectionHeader(
    doc,
    "Fund Utilisation Report",
    `Generated ${reportDateStamp()} · FY ${data.dashboard.fiscalYearLabel}`
  );

  doc.fontSize(11).font("Helvetica-Bold").text("FY summary");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9);
  for (const [label, value] of fySummary) {
    doc.text(`${label}: ${value}`);
  }
  doc.moveDown(1);

  doc.fontSize(11).font("Helvetica-Bold").text("Scheme summary");
  doc.moveDown(0.5);
  let ctx = createPdfTableContext(doc, [140, 80, 80, 80, 70, 80]);
  drawPdfTableHeader(ctx, [...SCHEME_HEADERS]);
  drawPdfTableRows(ctx, [...SCHEME_HEADERS], summaryRows);
  doc.moveDown(1);

  doc.fontSize(11).font("Helvetica-Bold").text("Beneficiaries");
  doc.moveDown(0.5);
  ctx = createPdfTableContext(doc, [100, 90, 70, 90, 120, 70, 70]);
  drawPdfTableHeader(ctx, [...BENEFICIARY_HEADERS]);
  drawPdfTableRows(ctx, [...BENEFICIARY_HEADERS], beneficiaryDetailRows);

  const { buffer } = await pdfBufferFromDocument(doc, "fund-utilisation.pdf");
  return pdfResult(buffer, "fund-utilisation");
}
