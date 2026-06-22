import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { VerificationReportData } from "@/lib/repositories/state-report-data";
import { verificationQueueStatusLabel } from "@/lib/state-verification-queue";
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

const QUEUE_HEADERS = [
  "Name",
  "Type",
  "District",
  "Admin",
  "Athletes",
  "Status",
  "Date",
] as const;

function breakdownRows(data: VerificationReportData): string[][] {
  const { breakdown } = data;
  return [
    ["Verified", String(breakdown.verified)],
    ["Pending", String(breakdown.pending)],
    ["Flagged", String(breakdown.flagged)],
    ["Verification rate", `${breakdown.rate}%`],
  ];
}

function queueRows(data: VerificationReportData): string[][] {
  return data.queue.map((item) => {
    const date =
      item.kind === "onboarding"
        ? item.submittedAt ?? "—"
        : item.registeredAt ?? "—";
    const athletes =
      item.kind === "onboarding" ? "—" : String(item.athleteCount);

    return [
      item.name,
      item.queueTypeLabel,
      item.district,
      item.adminFullName,
      athletes,
      verificationQueueStatusLabel(item),
      date,
    ];
  });
}

export async function generateVerificationReport(
  format: ReportFormat,
  data: VerificationReportData
): Promise<GeneratedReport> {
  const summary = breakdownRows(data);
  const queue = queueRows(data);

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Khel Setu";
    workbook.created = new Date();
    addXlsxSheet(workbook, "Verification Summary", ["Metric", "Value"], summary);
    addXlsxSheet(workbook, "Verification Queue", [...QUEUE_HEADERS], queue);
    const buffer = await workbookToBuffer(workbook);
    return xlsxResult(buffer, "verification-compliance");
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  writePdfSectionHeader(
    doc,
    "Verification Compliance Report",
    `Generated ${reportDateStamp()} · ${data.queue.length} queue items`
  );

  doc.fontSize(11).font("Helvetica-Bold").text("Summary");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9);
  for (const [label, value] of summary) {
    doc.text(`${label}: ${value}`);
  }
  doc.moveDown(1);

  doc.fontSize(11).font("Helvetica-Bold").text("Verification queue");
  doc.moveDown(0.5);
  const ctx = createPdfTableContext(doc, [120, 70, 80, 90, 60, 90, 80]);
  drawPdfTableHeader(ctx, [...QUEUE_HEADERS]);
  drawPdfTableRows(ctx, [...QUEUE_HEADERS], queue);

  const { buffer } = await pdfBufferFromDocument(doc, "verification-compliance.pdf");
  return pdfResult(buffer, "verification-compliance");
}
