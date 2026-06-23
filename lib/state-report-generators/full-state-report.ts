import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { scoutingStatusLabel } from "@/lib/scouting-status";
import type { FullStateReportData } from "@/lib/repositories/state-report-data";
import {
  beneficiaryDetailRowsForReport,
  countAllReportableBeneficiaries,
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

const DISTRICT_HEADERS = ["District", "Nurseries", "Athletes", "Verified", "Coaches"];
const SCHEME_HEADERS = [
  "Scheme",
  "Beneficiary type",
  "Allocated",
  "Disbursed",
  "Utilisation %",
  "Beneficiaries",
];
const BENEFICIARY_HEADERS = [
  "Scheme",
  "Name",
  "District",
  "Nursery",
  "Sport / detail",
  "Grant status",
  "Grant amount",
];
const TALENT_HEADERS = [
  "Athlete",
  "Sport",
  "Weight / Batch",
  "District",
  "Nursery",
  "KhelSetu score",
  "Status",
  "Player ID",
];
const VERIFICATION_HEADERS = [
  "Name",
  "Type",
  "District",
  "Admin",
  "Athletes",
  "Status",
  "Date",
];

function districtRows(data: FullStateReportData): string[][] {
  return data.districts.districts.map((d) => [
    d.name,
    String(d.nurseries),
    String(d.athleteCount),
    d.verified,
    String(d.coaches),
  ]);
}

function schemeRows(data: FullStateReportData): string[][] {
  return schemeSummaryRowsForReport(data.funds);
}

function beneficiaryRows(data: FullStateReportData): string[][] {
  return beneficiaryDetailRowsForReport(data.funds);
}

function talentRows(data: FullStateReportData): string[][] {
  return data.talent.rows.map((row) => [
    row.athlete,
    row.sport,
    row.weightBatch,
    row.district,
    row.nursery,
    row.score,
    scoutingStatusLabel(row.status),
    row.playerId,
  ]);
}

function verificationSummaryRows(data: FullStateReportData): string[][] {
  const { breakdown } = data.verification;
  return [
    ["Verified", String(breakdown.verified)],
    ["Pending", String(breakdown.pending)],
    ["Flagged", String(breakdown.flagged)],
    ["Verification rate", `${breakdown.rate}%`],
  ];
}

function verificationQueueRows(data: FullStateReportData): string[][] {
  return data.verification.queue.map((item) => {
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
      item.statusLabel,
      date,
    ];
  });
}

export async function generateFullStateReport(
  format: ReportFormat,
  data: FullStateReportData
): Promise<GeneratedReport> {
  const overviewRows: string[][] = [
    ["Nurseries", String(data.districts.districts.reduce((sum, d) => sum + d.nurseries, 0))],
    ["Athletes", String(data.districts.districts.reduce((sum, d) => sum + d.athleteCount, 0))],
    ["Coaches", String(data.districts.districts.reduce((sum, d) => sum + d.coaches, 0))],
    ["Verified nurseries", String(data.verification.breakdown.verified)],
    ["Pending verification", String(data.verification.breakdown.pending)],
    ["Flagged nurseries", String(data.verification.breakdown.flagged)],
    ["Verification rate", `${data.verification.breakdown.rate}%`],
    ["Total disbursed", data.funds.dashboard.totalDisbursed],
    ["Fund beneficiaries (pending + paid)", String(countAllReportableBeneficiaries(data.funds))],
    ["Shortlisted athletes", String(data.talent.rows.length)],
    ["Verification queue items", String(data.verification.queue.length)],
  ];

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Khel Setu";
    workbook.created = new Date();
    addXlsxSheet(workbook, "Summary", ["Metric", "Value"], overviewRows);
    addXlsxSheet(workbook, "Districts", DISTRICT_HEADERS, districtRows(data));
    addXlsxSheet(workbook, "Funds Summary", SCHEME_HEADERS, schemeRows(data));
    addXlsxSheet(workbook, "Funds Beneficiaries", BENEFICIARY_HEADERS, beneficiaryRows(data));
    addXlsxSheet(workbook, "Talent Pipeline", TALENT_HEADERS, talentRows(data));
    addXlsxSheet(
      workbook,
      "Verification Summary",
      ["Metric", "Value"],
      verificationSummaryRows(data)
    );
    addXlsxSheet(
      workbook,
      "Verification Queue",
      VERIFICATION_HEADERS,
      verificationQueueRows(data)
    );
    const buffer = await workbookToBuffer(workbook);
    return xlsxResult(buffer, "full-state-report");
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  writePdfSectionHeader(
    doc,
    "Full State Report",
    `Generated ${reportDateStamp()} · Haryana sports portal`
  );

  doc.fontSize(11).font("Helvetica-Bold").text("State overview");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9);
  for (const [label, value] of overviewRows) {
    doc.text(`${label}: ${value}`);
  }
  doc.addPage({ layout: "landscape" });

  writePdfSectionHeader(doc, "District performance", `${data.districts.districts.length} districts`);
  let ctx = createPdfTableContext(doc, [120, 70, 70, 120, 70]);
  drawPdfTableHeader(ctx, DISTRICT_HEADERS);
  drawPdfTableRows(ctx, DISTRICT_HEADERS, districtRows(data));

  doc.addPage({ layout: "landscape" });
  writePdfSectionHeader(doc, "Fund utilisation", `FY ${data.funds.dashboard.fiscalYearLabel}`);
  ctx = createPdfTableContext(doc, [140, 80, 80, 80, 70, 80]);
  drawPdfTableHeader(ctx, SCHEME_HEADERS);
  drawPdfTableRows(ctx, SCHEME_HEADERS, schemeRows(data));
  doc.moveDown(1);
  doc.fontSize(11).font("Helvetica-Bold").text("Beneficiaries");
  doc.moveDown(0.5);
  ctx = createPdfTableContext(doc, [100, 90, 70, 90, 120, 70, 70]);
  drawPdfTableHeader(ctx, BENEFICIARY_HEADERS);
  drawPdfTableRows(ctx, BENEFICIARY_HEADERS, beneficiaryRows(data));

  doc.addPage({ layout: "landscape" });
  writePdfSectionHeader(doc, "Talent pipeline", `${data.talent.rows.length} athletes`);
  ctx = createPdfTableContext(doc, [100, 70, 90, 70, 100, 60, 80, 110]);
  drawPdfTableHeader(ctx, TALENT_HEADERS);
  drawPdfTableRows(ctx, TALENT_HEADERS, talentRows(data));

  doc.addPage({ layout: "landscape" });
  writePdfSectionHeader(doc, "Verification compliance", `${data.verification.queue.length} queue items`);
  doc.fontSize(10).font("Helvetica");
  for (const [label, value] of verificationSummaryRows(data)) {
    doc.text(`${label}: ${value}`);
  }
  doc.moveDown(1);
  ctx = createPdfTableContext(doc, [120, 70, 80, 90, 60, 90, 80]);
  drawPdfTableHeader(ctx, VERIFICATION_HEADERS);
  drawPdfTableRows(ctx, VERIFICATION_HEADERS, verificationQueueRows(data));

  const { buffer } = await pdfBufferFromDocument(doc, "full-state-report.pdf");
  return pdfResult(buffer, "full-state-report");
}
