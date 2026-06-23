import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { StateAthleteReportFilters, StateAthleteReportRow } from "@/lib/state-portal";

export type AthletesRosterReportFormat = "xlsx" | "pdf";

const COLUMNS = [
  "Player ID",
  "Name",
  "Age",
  "Sport",
  "Weight",
  "Height",
  "Batch",
  "District",
  "Nursery",
  "KhelSetu score",
  "Player status",
  "Scouting status",
  "Primary coach",
  "Joined",
] as const;

function filterSummary(filters?: StateAthleteReportFilters): string {
  const parts: string[] = [];
  if (filters?.sport && filters.sport !== "all") parts.push(`Sport: ${filters.sport}`);
  if (filters?.district && filters.district !== "all") parts.push(`District: ${filters.district}`);
  if (filters?.minRating != null) parts.push(`Min score: ${filters.minRating}`);
  if (filters?.search?.trim()) parts.push(`Search: ${filters.search.trim()}`);
  return parts.length > 0 ? parts.join(" · ") : "All athletes (no filters)";
}

function rowToCells(row: StateAthleteReportRow): string[] {
  return [
    row.playerId,
    row.name,
    row.age,
    row.sport,
    row.weight,
    row.height,
    row.batch,
    row.district,
    row.nursery,
    row.score,
    row.playerStatus,
    row.scoutingStatus,
    row.primaryCoach,
    row.joined,
  ];
}

export async function generateAthletesRosterXlsx(
  rows: StateAthleteReportRow[],
  filters?: StateAthleteReportFilters
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Khel Setu";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("State athletes roster");
  sheet.addRow(["State athletes roster"]);
  sheet.getRow(1).font = { bold: true, size: 14 };
  sheet.addRow([filterSummary(filters)]);
  sheet.addRow([`Generated ${new Date().toLocaleString("en-IN")} · ${rows.length} athletes`]);
  sheet.addRow([]);
  sheet.addRow([...COLUMNS]);
  sheet.getRow(5).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(rowToCells(row));
  }

  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? "";
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(maxLength, 36);
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const date = new Date().toISOString().slice(0, 10);

  return {
    buffer,
    filename: `state-athletes-roster-${date}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export async function generateAthletesRosterPdf(
  rows: StateAthleteReportRow[],
  filters?: StateAthleteReportFilters
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const date = new Date().toISOString().slice(0, 10);
      resolve({
        buffer: Buffer.concat(chunks),
        filename: `state-athletes-roster-${date}.pdf`,
        mimeType: "application/pdf",
      });
    });
    doc.on("error", reject);

    doc.fontSize(14).font("Helvetica-Bold").text("State athletes roster");
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#62708C")
      .text(filterSummary(filters));
    doc.text(`Generated ${new Date().toLocaleString("en-IN")} · ${rows.length} athletes`);
    doc.moveDown(0.75);
    doc.fillColor("#172139");

    const colWidths = [52, 72, 28, 48, 36, 36, 44, 48, 72, 44, 44, 56, 64, 44];
    const startX = doc.page.margins.left;
    let y = doc.y;

    function drawHeaderRow() {
      let x = startX;
      doc.font("Helvetica-Bold").fontSize(6.5);
      for (let i = 0; i < COLUMNS.length; i++) {
        doc.text(COLUMNS[i]!, x, y, { width: colWidths[i]!, lineBreak: false });
        x += colWidths[i]!;
      }
      y += 14;
      doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke("#E2E8F0");
      y += 4;
    }

    drawHeaderRow();

    doc.font("Helvetica").fontSize(6.5);
    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage({ layout: "landscape" });
        y = doc.page.margins.top;
        drawHeaderRow();
      }

      let x = startX;
      const cells = rowToCells(row);
      let rowHeight = 12;

      for (let i = 0; i < cells.length; i++) {
        const height = doc.heightOfString(cells[i]!, { width: colWidths[i]! });
        rowHeight = Math.max(rowHeight, height + 2);
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

export async function generateAthletesRosterReport(
  format: AthletesRosterReportFormat,
  rows: StateAthleteReportRow[],
  filters?: StateAthleteReportFilters
) {
  if (format === "pdf") {
    return generateAthletesRosterPdf(rows, filters);
  }
  return generateAthletesRosterXlsx(rows, filters);
}
