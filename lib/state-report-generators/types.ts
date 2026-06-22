export type ReportFormat = "pdf" | "xlsx";

export type GeneratedReport = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};
