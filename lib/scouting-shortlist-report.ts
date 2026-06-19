import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { scoutingStatusLabel } from "@/lib/scouting-status";
import type { ScoutingShortlistReportRow } from "@/lib/state-portal";

export type ShortlistReportFormat = "xlsx" | "pdf";

const COLUMNS = [
  "Athlete",
  "Sport",
  "Weight / Batch",
  "District",
  "Nursery",
  "KhelSetu score",
  "Status",
  "Player ID",
] as const;

function rowToCells(row: ScoutingShortlistReportRow): string[] {
  return [
    row.athlete,
    row.sport,
    row.weightBatch,
    row.district,
    row.nursery,
    row.score,
    scoutingStatusLabel(row.status),
    row.playerId,
  ];
}

export async function generateShortlistXlsx(
  rows: ScoutingShortlistReportRow[]
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Khel Setu";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Khelo India shortlist");
  sheet.addRow([...COLUMNS]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(rowToCells(row));
  }

  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? "";
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(maxLength, 40);
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const date = new Date().toISOString().slice(0, 10);

  return {
    buffer,
    filename: `khelo-india-shortlist-${date}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export async function generateShortlistPdf(
  rows: ScoutingShortlistReportRow[]
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const date = new Date().toISOString().slice(0, 10);
      resolve({
        buffer: Buffer.concat(chunks),
        filename: `khelo-india-shortlist-${date}.pdf`,
        mimeType: "application/pdf",
      });
    });
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text("Khelo India Talent Shortlist", {
      align: "left",
    });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#62708C")
      .text(`Generated ${new Date().toLocaleString("en-IN")} · ${rows.length} athletes`, {
        align: "left",
      });
    doc.moveDown(1);
    doc.fillColor("#172139");

    const colWidths = [110, 70, 90, 70, 100, 60, 100, 120];
    const startX = doc.page.margins.left;
    let y = doc.y;

    function drawHeaderRow() {
      let x = startX;
      doc.font("Helvetica-Bold").fontSize(8);
      for (let i = 0; i < COLUMNS.length; i++) {
        doc.text(COLUMNS[i]!, x, y, { width: colWidths[i]!, lineBreak: false });
        x += colWidths[i]!;
      }
      y += 16;
      doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke("#E2E8F0");
      y += 6;
    }

    drawHeaderRow();

    doc.font("Helvetica").fontSize(7.5);
    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 24) {
        doc.addPage({ layout: "landscape" });
        y = doc.page.margins.top;
        drawHeaderRow();
      }

      let x = startX;
      const cells = rowToCells(row);
      let rowHeight = 14;

      for (let i = 0; i < cells.length; i++) {
        const height = doc.heightOfString(cells[i]!, { width: colWidths[i]! });
        rowHeight = Math.max(rowHeight, height + 4);
      }

      for (let i = 0; i < cells.length; i++) {
        doc.text(cells[i]!, x, y, { width: colWidths[i]!, lineBreak: false });
        x += colWidths[i]!;
      }

      y += rowHeight;
    }

    doc.end();
  });
}

export async function generateShortlistReport(
  format: ShortlistReportFormat,
  rows: ScoutingShortlistReportRow[]
) {
  if (format === "pdf") {
    return generateShortlistPdf(rows);
  }
  return generateShortlistXlsx(rows);
}
