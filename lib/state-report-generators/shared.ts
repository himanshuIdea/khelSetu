import type ExcelJS from "exceljs";
import type PDFDocument from "pdfkit";
import { formatStateFundAmount } from "@/lib/format";

type PdfDoc = InstanceType<typeof PDFDocument>;

export function reportDateStamp(): string {
  return new Date().toLocaleString("en-IN");
}

export function reportFileDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatGrantAmount(paise: number): string {
  return paise > 0 ? formatStateFundAmount(paise) : "—";
}

export function formatGrantStatus(status: "none" | "pending" | "paid"): string {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Pending";
  return "None";
}

export function addXlsxSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  headers: string[],
  rows: string[][]
): void {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(row);
  }

  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? "";
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(maxLength, 48);
  });
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function writePdfSectionHeader(doc: PdfDoc, title: string, subtitle?: string): void {
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#172139").text(title, { align: "left" });
  if (subtitle) {
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#62708C")
      .text(subtitle, { align: "left" });
  }
  doc.moveDown(1);
  doc.fillColor("#172139");
}

export type PdfTableContext = {
  doc: PdfDoc;
  colWidths: number[];
  startX: number;
  y: number;
  layout?: "portrait" | "landscape";
};

export function createPdfTableContext(
  doc: PdfDoc,
  colWidths: number[],
  layout: "portrait" | "landscape" = "landscape"
): PdfTableContext {
  return {
    doc,
    colWidths,
    startX: doc.page.margins.left,
    y: doc.y,
    layout,
  };
}

export function drawPdfTableHeader(ctx: PdfTableContext, headers: string[]): void {
  const { doc, colWidths, startX } = ctx;
  let x = startX;
  doc.font("Helvetica-Bold").fontSize(8);
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i]!, x, ctx.y, { width: colWidths[i]!, lineBreak: false });
    x += colWidths[i]!;
  }
  ctx.y += 16;
  doc
    .moveTo(startX, ctx.y)
    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), ctx.y)
    .stroke("#E2E8F0");
  ctx.y += 6;
  doc.font("Helvetica").fontSize(7.5);
}

export function drawPdfTableRows(
  ctx: PdfTableContext,
  headers: string[],
  rows: string[][]
): void {
  const { doc, colWidths, startX, layout = "landscape" } = ctx;

  for (const cells of rows) {
    if (ctx.y > doc.page.height - doc.page.margins.bottom - 24) {
      doc.addPage({ layout });
      ctx.y = doc.page.margins.top;
      drawPdfTableHeader(ctx, headers);
    }

    let x = startX;
    let rowHeight = 14;

    for (let i = 0; i < cells.length; i++) {
      const height = doc.heightOfString(cells[i]!, { width: colWidths[i]! });
      rowHeight = Math.max(rowHeight, height + 4);
    }

    for (let i = 0; i < cells.length; i++) {
      doc.text(cells[i]!, x, ctx.y, { width: colWidths[i]!, lineBreak: false });
      x += colWidths[i]!;
    }

    ctx.y += rowHeight;
  }

  doc.y = ctx.y;
}

export function pdfBufferFromDocument(
  doc: PdfDoc,
  filename: string
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve({
        buffer: Buffer.concat(chunks),
        filename,
        mimeType: "application/pdf",
      });
    });
    doc.on("error", reject);
    doc.end();
  });
}

export function xlsxResult(
  buffer: Buffer,
  filenameStem: string
): { buffer: Buffer; filename: string; mimeType: string } {
  return {
    buffer,
    filename: `${filenameStem}-${reportFileDate()}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export function pdfResult(
  buffer: Buffer,
  filenameStem: string
): { buffer: Buffer; filename: string; mimeType: string } {
  return {
    buffer,
    filename: `${filenameStem}-${reportFileDate()}.pdf`,
    mimeType: "application/pdf",
  };
}
